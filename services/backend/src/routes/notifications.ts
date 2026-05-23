import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@nullforum/database';
import { authenticate, JWTPayload } from '../lib/auth';

export async function notificationRoutes(app: FastifyInstance) {
  // Get notifications
  app.get('/', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;
    const { page = '1', limit = '20', unreadOnly = 'false' } = request.query as any;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const where: any = { userId: user.userId };
    if (unreadOnly === 'true') where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          actor: { select: { id: true, username: true, avatar: true } },
        },
        take: limitNum,
        skip: (pageNum - 1) * limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: user.userId, isRead: false } }),
    ]);

    return reply.send({
      success: true,
      data: notifications,
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum), unreadCount },
    });
  });

  // Get unread count
  app.get('/unread-count', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;

    const count = await prisma.notification.count({
      where: { userId: user.userId, isRead: false },
    });

    return reply.send({ success: true, data: { count } });
  });

  // Mark as read
  app.put('/:notificationId/read', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;
    const { notificationId } = request.params as { notificationId: string };

    await prisma.notification.updateMany({
      where: { id: notificationId, userId: user.userId },
      data: { isRead: true, readAt: new Date() },
    });

    return reply.send({ success: true, data: { message: 'Marked as read' } });
  });

  // Mark all as read
  app.put('/read-all', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;

    await prisma.notification.updateMany({
      where: { userId: user.userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return reply.send({ success: true, data: { message: 'All notifications marked as read' } });
  });

  // Delete notification
  app.delete('/:notificationId', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;
    const { notificationId } = request.params as { notificationId: string };

    await prisma.notification.deleteMany({
      where: { id: notificationId, userId: user.userId },
    });

    return reply.send({ success: true, data: { message: 'Notification deleted' } });
  });

  // Clear all notifications
  app.delete('/', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;

    await prisma.notification.deleteMany({
      where: { userId: user.userId },
    });

    return reply.send({ success: true, data: { message: 'All notifications cleared' } });
  });
}
