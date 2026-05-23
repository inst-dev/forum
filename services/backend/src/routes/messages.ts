import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@nullforum/database';
import { createMessageSchema } from '@nullforum/shared';
import { authenticate, JWTPayload } from '../lib/auth';
import { filterContent } from '../lib/profanity';
import { rateLimitCache } from '../lib/redis';

export async function messageRoutes(app: FastifyInstance) {
  // Get conversations
  app.get('/conversations', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;
    const { page = '1', limit = '20' } = request.query as any;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50);

    const conversations = await prisma.conversationMember.findMany({
      where: { userId: user.userId, isArchived: false },
      include: {
        conversation: {
          include: {
            members: {
              where: { userId: { not: user.userId } },
              include: {
                user: { select: { id: true, username: true, displayName: true, avatar: true } },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { content: true, createdAt: true, senderId: true, isRead: true },
            },
          },
        },
      },
      orderBy: { conversation: { lastMessageAt: 'desc' } },
      take: limitNum,
      skip: (pageNum - 1) * limitNum,
    });

    const data = conversations.map(cm => ({
      id: cm.conversation.id,
      otherUser: cm.conversation.members[0]?.user,
      lastMessage: cm.conversation.messages[0] || null,
      messageCount: cm.conversation.messageCount,
      lastMessageAt: cm.conversation.lastMessageAt,
      isMuted: cm.isMuted,
      lastReadAt: cm.lastReadAt,
    }));

    return reply.send({ success: true, data });
  });

  // Get messages in conversation
  app.get('/conversations/:conversationId', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;
    const { conversationId } = request.params as { conversationId: string };
    const { page = '1', limit = '50' } = request.query as any;

    // Verify membership
    const member = await prisma.conversationMember.findFirst({
      where: { conversationId, userId: user.userId },
    });

    if (!member) {
      return reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not a member of this conversation' },
      });
    }

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const [messages, total] = await Promise.all([
      prisma.directMessage.findMany({
        where: { conversationId, deletedAt: null },
        include: {
          sender: { select: { id: true, username: true, avatar: true } },
          attachments: { select: { id: true, fileName: true, mimeType: true, url: true } },
        },
        take: limitNum,
        skip: (pageNum - 1) * limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.directMessage.count({ where: { conversationId, deletedAt: null } }),
    ]);

    // Mark messages as read
    await prisma.directMessage.updateMany({
      where: { conversationId, recipientId: user.userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    await prisma.conversationMember.update({
      where: { id: member.id },
      data: { lastReadAt: new Date() },
    });

    return reply.send({
      success: true,
      data: messages.reverse(),
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  });

  // Send message
  app.post('/', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;
    const body = createMessageSchema.parse(request.body);

    // Rate limiting
    const msgCount = await rateLimitCache.incr(`msg:${user.userId}`, 60);
    if (msgCount > 30) {
      return reply.status(429).send({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many messages. Slow down.' },
      });
    }

    // Check if blocked
    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: body.recipientId, blockedId: user.userId },
          { blockerId: user.userId, blockedId: body.recipientId },
        ],
      },
    });

    if (blocked) {
      return reply.status(403).send({
        success: false,
        error: { code: 'BLOCKED', message: 'Cannot send messages to this user' },
      });
    }

    // Check recipient privacy
    const recipient = await prisma.user.findUnique({
      where: { id: body.recipientId },
      include: { privacySettings: true },
    });

    if (!recipient || recipient.deletedAt) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    if (recipient.privacySettings?.hideMessages) {
      return reply.status(403).send({
        success: false,
        error: { code: 'MESSAGES_DISABLED', message: 'This user has disabled messages' },
      });
    }

    // Profanity filter
    const { filtered } = await filterContent(body.content);

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { members: { some: { userId: user.userId } } },
          { members: { some: { userId: body.recipientId } } },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          members: {
            create: [
              { userId: user.userId },
              { userId: body.recipientId },
            ],
          },
        },
      });
    }

    const message = await prisma.directMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: user.userId,
        recipientId: body.recipientId,
        content: filtered,
      },
      include: {
        sender: { select: { id: true, username: true, avatar: true } },
      },
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastMessageId: message.id,
        messageCount: { increment: 1 },
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: body.recipientId,
        actorId: user.userId,
        type: 'MESSAGE',
        title: 'New message',
        message: `${user.username} sent you a message`,
        link: `/messages/${conversation.id}`,
      },
    });

    return reply.status(201).send({ success: true, data: message });
  });

  // Delete message
  app.delete('/:messageId', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;
    const { messageId } = request.params as { messageId: string };

    const message = await prisma.directMessage.findUnique({ where: { id: messageId } });
    if (!message || message.senderId !== user.userId) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Message not found' },
      });
    }

    await prisma.directMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });

    return reply.send({ success: true, data: { message: 'Message deleted' } });
  });

  // Search conversations
  app.get('/search', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;
    const { q } = request.query as { q: string };

    if (!q || q.length < 2) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_QUERY', message: 'Search query too short' },
      });
    }

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [{ senderId: user.userId }, { recipientId: user.userId }],
        content: { contains: q },
        deletedAt: null,
      },
      include: {
        sender: { select: { id: true, username: true, avatar: true } },
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ success: true, data: messages });
  });
}
