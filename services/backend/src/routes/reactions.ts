import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@nullforum/database';
import { createReactionSchema } from '@nullforum/shared';
import { authenticate, JWTPayload } from '../lib/auth';
import { rateLimitCache } from '../lib/redis';

export async function reactionRoutes(app: FastifyInstance) {
  // Add/remove reaction
  app.post('/', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;
    const body = createReactionSchema.parse(request.body);

    // Rate limit
    const count = await rateLimitCache.incr(`reaction:${user.userId}`, 60);
    if (count > 50) {
      return reply.status(429).send({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many reactions' },
      });
    }

    const where: any = { userId: user.userId, type: body.reactionType };
    if (body.targetType === 'THREAD') {
      where.threadId = body.targetId;
    } else {
      where.commentId = body.targetId;
    }

    // Check existing
    const existing = await prisma.reaction.findFirst({ where });

    if (existing) {
      // Remove reaction
      await prisma.reaction.delete({ where: { id: existing.id } });
      
      // Update count
      if (body.targetType === 'THREAD') {
        await prisma.thread.update({
          where: { id: body.targetId },
          data: { reactionCount: { decrement: 1 } },
        });
      } else {
        await prisma.comment.update({
          where: { id: body.targetId },
          data: { reactionCount: { decrement: 1 } },
        });
      }

      // Update user reaction score
      const target = body.targetType === 'THREAD' 
        ? await prisma.thread.findUnique({ where: { id: body.targetId }, select: { authorId: true } })
        : await prisma.comment.findUnique({ where: { id: body.targetId }, select: { authorId: true } });

      if (target && target.authorId !== user.userId) {
        const scoreMap: Record<string, number> = { like: 1, love: 2, funny: 1, helpful: 3, sad: 0, angry: -1 };
        await prisma.user.update({
          where: { id: target.authorId },
          data: { reactionScore: { decrement: scoreMap[body.reactionType] || 0 } },
        });
      }

      return reply.send({ success: true, data: { action: 'removed', type: body.reactionType } });
    }

    // Add reaction
    const data: any = { type: body.reactionType, userId: user.userId };
    if (body.targetType === 'THREAD') {
      data.threadId = body.targetId;
    } else {
      data.commentId = body.targetId;
    }

    await prisma.reaction.create({ data });

    // Update count
    if (body.targetType === 'THREAD') {
      await prisma.thread.update({
        where: { id: body.targetId },
        data: { reactionCount: { increment: 1 } },
      });
    } else {
      await prisma.comment.update({
        where: { id: body.targetId },
        data: { reactionCount: { increment: 1 } },
      });
    }

    // Update author's reaction score
    const target = body.targetType === 'THREAD'
      ? await prisma.thread.findUnique({ where: { id: body.targetId }, select: { authorId: true } })
      : await prisma.comment.findUnique({ where: { id: body.targetId }, select: { authorId: true } });

    if (target && target.authorId !== user.userId) {
      const scoreMap: Record<string, number> = { like: 1, love: 2, funny: 1, helpful: 3, sad: 0, angry: -1 };
      await prisma.user.update({
        where: { id: target.authorId },
        data: { reactionScore: { increment: scoreMap[body.reactionType] || 0 } },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: target.authorId,
          actorId: user.userId,
          type: 'REACTION',
          title: 'New reaction',
          message: `${user.username} reacted with ${body.reactionType}`,
          link: body.targetType === 'THREAD' ? `/thread/${body.targetId}` : null,
        },
      });
    }

    return reply.send({ success: true, data: { action: 'added', type: body.reactionType } });
  });

  // Get reactions for a target
  app.get('/:targetType/:targetId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { targetType, targetId } = request.params as { targetType: string; targetId: string };

    const where: any = {};
    if (targetType === 'thread') where.threadId = targetId;
    else if (targetType === 'comment') where.commentId = targetId;
    else return reply.status(400).send({ success: false, error: { code: 'INVALID_TYPE', message: 'Invalid target type' } });

    const reactions = await prisma.reaction.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    });

    // Group by type
    const grouped: Record<string, any[]> = {};
    for (const reaction of reactions) {
      if (!grouped[reaction.type]) grouped[reaction.type] = [];
      grouped[reaction.type].push({
        userId: reaction.user.id,
        username: reaction.user.username,
        avatar: reaction.user.avatar,
      });
    }

    return reply.send({ success: true, data: grouped });
  });
}
