import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@nullforum/database';
import { createCommentSchema, updateCommentSchema } from '@nullforum/shared';
import { authenticate, JWTPayload } from '../lib/auth';
import { filterContent, calculateSpamScore } from '../lib/profanity';
import { cache } from '../lib/redis';

export async function commentRoutes(app: FastifyInstance) {
  // Get comments for a thread
  app.get('/thread/:threadId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { threadId } = request.params as { threadId: string };
    const { page = '1', limit = '20', sort = 'oldest' } = request.query as any;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const orderBy = sort === 'newest' ? { createdAt: 'desc' as const } : { createdAt: 'asc' as const };

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { threadId, deletedAt: null, parentId: null },
        include: {
          author: {
            select: {
              id: true, username: true, displayName: true, avatar: true,
              memberStatus: true, role: true, points: true, reactionScore: true,
              signature: true, createdAt: true, isShadowBanned: true,
              badges: { include: { badge: true }, take: 3 },
            },
          },
          reactions: {
            select: { type: true, userId: true },
          },
          replies: {
            where: { deletedAt: null },
            include: {
              author: {
                select: {
                  id: true, username: true, displayName: true, avatar: true,
                  memberStatus: true, role: true,
                },
              },
              reactions: { select: { type: true, userId: true } },
            },
            orderBy: { createdAt: 'asc' },
            take: 5,
          },
          attachments: { select: { id: true, fileName: true, originalName: true, mimeType: true, url: true } },
          _count: { select: { replies: true } },
        },
        take: limitNum,
        skip: (pageNum - 1) * limitNum,
        orderBy,
      }),
      prisma.comment.count({ where: { threadId, deletedAt: null, parentId: null } }),
    ]);

    // Filter shadow banned users' comments for other users
    const filtered = comments.filter(c => !(c.author as any).isShadowBanned);

    return reply.send({
      success: true,
      data: filtered.map(c => ({
        ...c,
        author: { ...c.author, isShadowBanned: undefined },
      })),
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum), hasNext: pageNum * limitNum < total, hasPrev: pageNum > 1 },
    });
  });

  // Get replies for a comment
  app.get('/:commentId/replies', async (request: FastifyRequest, reply: FastifyReply) => {
    const { commentId } = request.params as { commentId: string };
    const { page = '1', limit = '10' } = request.query as any;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50);

    const [replies, total] = await Promise.all([
      prisma.comment.findMany({
        where: { parentId: commentId, deletedAt: null },
        include: {
          author: {
            select: { id: true, username: true, displayName: true, avatar: true, memberStatus: true, role: true },
          },
          reactions: { select: { type: true, userId: true } },
        },
        take: limitNum,
        skip: (pageNum - 1) * limitNum,
        orderBy: { createdAt: 'asc' },
      }),
      prisma.comment.count({ where: { parentId: commentId, deletedAt: null } }),
    ]);

    return reply.send({
      success: true,
      data: replies,
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  });

  // Create comment
  app.post('/', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;
    const body = createCommentSchema.parse(request.body);

    // Check if thread is locked
    const thread = await prisma.thread.findUnique({
      where: { id: body.threadId },
      select: { id: true, isLocked: true, authorId: true, title: true, slug: true },
    });

    if (!thread) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Thread not found' },
      });
    }

    if (thread.isLocked) {
      return reply.status(403).send({
        success: false,
        error: { code: 'THREAD_LOCKED', message: 'This thread is locked' },
      });
    }

    // Check muted status
    const userRecord = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { isMuted: true, mutedUntil: true },
    });

    if (userRecord?.isMuted && (!userRecord.mutedUntil || userRecord.mutedUntil > new Date())) {
      return reply.status(403).send({
        success: false,
        error: { code: 'MUTED', message: 'Your account is muted' },
      });
    }

    // Profanity filter
    const { filtered, flagged, score } = await filterContent(body.content);
    const spamScore = await calculateSpamScore(body.content, user.userId);

    if (spamScore > 10) {
      return reply.status(403).send({
        success: false,
        error: { code: 'SPAM_DETECTED', message: 'Your comment was flagged as spam' },
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content: filtered,
        authorId: user.userId,
        threadId: body.threadId,
        parentId: body.parentId || null,
        quotedCommentId: body.quotedCommentId || null,
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatar: true, memberStatus: true, role: true },
        },
      },
    });

    // Update thread stats
    await prisma.thread.update({
      where: { id: body.threadId },
      data: {
        commentCount: { increment: 1 },
        lastCommentAt: new Date(),
        lastCommentById: user.userId,
      },
    });

    // Update forum stats
    const threadForum = await prisma.thread.findUnique({
      where: { id: body.threadId },
      select: { forumId: true },
    });
    if (threadForum) {
      await prisma.forum.update({
        where: { id: threadForum.forumId },
        data: { commentCount: { increment: 1 } },
      });
    }

    // Award points
    await prisma.user.update({
      where: { id: user.userId },
      data: { points: { increment: 2 } },
    });

    // Create notification for thread author
    if (thread.authorId !== user.userId) {
      await prisma.notification.create({
        data: {
          userId: thread.authorId,
          actorId: user.userId,
          type: 'REPLY',
          title: 'New reply',
          message: `${user.username} replied to your thread "${thread.title}"`,
          link: `/${thread.slug}/${thread.id}`,
        },
      });
    }

    // Detect mentions and create notifications
    const mentions = body.content.match(/@(\w+)/g);
    if (mentions) {
      const usernames = mentions.map(m => m.slice(1));
      const mentionedUsers = await prisma.user.findMany({
        where: { username: { in: usernames }, id: { not: user.userId } },
        select: { id: true, username: true },
      });

      for (const mentioned of mentionedUsers) {
        await prisma.notification.create({
          data: {
            userId: mentioned.id,
            actorId: user.userId,
            type: 'MENTION',
            title: 'You were mentioned',
            message: `${user.username} mentioned you in "${thread.title}"`,
            link: `/${thread.slug}/${thread.id}`,
          },
        });
      }
    }

    // Notify watchers
    const watchers = await prisma.watchedThread.findMany({
      where: { threadId: body.threadId, userId: { not: user.userId } },
      select: { userId: true },
    });

    for (const watcher of watchers) {
      if (watcher.userId !== thread.authorId) {
        await prisma.notification.create({
          data: {
            userId: watcher.userId,
            actorId: user.userId,
            type: 'THREAD_UPDATE',
            title: 'Thread updated',
            message: `${user.username} replied in "${thread.title}"`,
            link: `/${thread.slug}/${thread.id}`,
          },
        });
      }
    }

    return reply.status(201).send({ success: true, data: comment });
  });

  // Update comment
  app.put('/:commentId', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;
    const { commentId } = request.params as { commentId: string };
    const body = updateCommentSchema.parse(request.body);

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.deletedAt) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Comment not found' },
      });
    }

    if (comment.authorId !== user.userId && !['ADMIN', 'SUPER_MODERATOR', 'MODERATOR'].includes(user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized' },
      });
    }

    const { filtered } = await filterContent(body.content);

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: filtered, isEdited: true, editCount: { increment: 1 } },
    });

    return reply.send({ success: true, data: updated });
  });

  // Delete comment (soft)
  app.delete('/:commentId', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;
    const { commentId } = request.params as { commentId: string };

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Comment not found' },
      });
    }

    if (comment.authorId !== user.userId && !['ADMIN', 'SUPER_MODERATOR', 'MODERATOR'].includes(user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized' },
      });
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });

    await prisma.thread.update({
      where: { id: comment.threadId },
      data: { commentCount: { decrement: 1 } },
    });

    return reply.send({ success: true, data: { message: 'Comment deleted' } });
  });
}
