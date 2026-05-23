import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@nullforum/database';
import { adminUserActionSchema, notificationBarSchema } from '@nullforum/shared';
import { requireAdmin, requireModerator, authenticate, JWTPayload } from '../lib/auth';
import { cache } from '../lib/redis';
import { sendWarningEmail } from '../lib/email';

export async function adminRoutes(app: FastifyInstance) {
  // ==================== DASHBOARD ====================
  app.get('/dashboard', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const [
      totalUsers, activeUsers, totalThreads, totalComments,
      totalReports, pendingReports, todayLogins, todayRegistrations,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { lastSeen: { gte: new Date(Date.now() - 86400000) } } }),
      prisma.thread.count({ where: { deletedAt: null } }),
      prisma.comment.count({ where: { deletedAt: null } }),
      prisma.report.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.loginHistory.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }, success: true } }),
      prisma.user.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    ]);

    return reply.send({
      success: true,
      data: {
        totalUsers, activeUsers, totalThreads, totalComments,
        totalReports, pendingReports, todayLogins, todayRegistrations,
      },
    });
  });

  // ==================== USER MANAGEMENT ====================
  app.get('/users', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { page = '1', limit = '20', search, role, status } = request.query as any;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const where: any = { deletedAt: null };
    if (search) where.OR = [{ username: { contains: search } }, { email: { contains: search } }];
    if (role) where.role = role;
    if (status === 'banned') where.isBanned = true;
    if (status === 'muted') where.isMuted = true;
    if (status === 'suspended') where.isSuspended = true;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, username: true, email: true, displayName: true, avatar: true,
          role: true, memberStatus: true, points: true, isBanned: true, isMuted: true,
          isSuspended: true, isShadowBanned: true, isVerified: true, isEmailVerified: true,
          createdAt: true, lastSeen: true, loginCount: true,
        },
        take: limitNum,
        skip: (pageNum - 1) * limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: users,
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  });

  // User moderation action
  app.post('/users/action', { preHandler: [requireModerator] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const admin = (request as any).user as JWTPayload;
    const body = adminUserActionSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { id: body.userId } });
    if (!user) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    const updates: any = {};
    let notifyUser = false;

    switch (body.action) {
      case 'BAN':
        updates.isBanned = true;
        updates.banReason = body.reason;
        notifyUser = true;
        break;
      case 'UNBAN':
        updates.isBanned = false;
        updates.banReason = null;
        break;
      case 'MUTE':
        updates.isMuted = true;
        updates.mutedUntil = body.duration ? new Date(Date.now() + body.duration * 1000) : null;
        notifyUser = true;
        break;
      case 'UNMUTE':
        updates.isMuted = false;
        updates.mutedUntil = null;
        break;
      case 'SUSPEND':
        updates.isSuspended = true;
        updates.suspendedUntil = body.duration ? new Date(Date.now() + body.duration * 1000) : null;
        notifyUser = true;
        break;
      case 'SHADOW_BAN':
        updates.isShadowBanned = true;
        break;
      case 'WARN':
        notifyUser = true;
        break;
      case 'VERIFY':
        updates.isVerified = true;
        break;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.user.update({ where: { id: body.userId }, data: updates });
    }

    // Log moderation action
    await prisma.moderationAction.create({
      data: {
        userId: body.userId,
        moderatorId: admin.userId,
        action: body.action,
        reason: body.reason,
        note: body.note,
        duration: body.duration,
        expiresAt: body.duration ? new Date(Date.now() + body.duration * 1000) : null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: `USER_${body.action}`,
        targetType: 'USER',
        targetId: body.userId,
        details: JSON.stringify({ reason: body.reason, duration: body.duration }),
        ipAddress: request.ip,
      },
    });

    // Send warning email
    if (notifyUser && body.reason) {
      await sendWarningEmail(user.email, user.username, body.reason);
    }

    return reply.send({ success: true, data: { message: `Action ${body.action} applied` } });
  });

  // ==================== REPORTS ====================
  app.get('/reports', { preHandler: [requireModerator] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { page = '1', limit = '20', status = 'PENDING' } = request.query as any;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const where: any = {};
    if (status !== 'all') where.status = status;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, username: true, avatar: true } },
          reportedUser: { select: { id: true, username: true, avatar: true } },
        },
        take: limitNum,
        skip: (pageNum - 1) * limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.report.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: reports,
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  });

  // Resolve report
  app.put('/reports/:reportId', { preHandler: [requireModerator] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const admin = (request as any).user as JWTPayload;
    const { reportId } = request.params as { reportId: string };
    const { status, adminNote } = request.body as { status: string; adminNote?: string };

    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: status as any,
        adminNote,
        resolvedBy: admin.userId,
        resolvedAt: new Date(),
      },
    });

    return reply.send({ success: true, data: { message: 'Report updated' } });
  });

  // ==================== USERNAME REQUESTS ====================
  app.get('/username-requests', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { status = 'PENDING' } = request.query as any;

    const requests = await prisma.usernameChangeRequest.findMany({
      where: { status: status as any },
      include: {
        user: { select: { id: true, username: true, avatar: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ success: true, data: requests });
  });

  // Approve/deny username request
  app.put('/username-requests/:requestId', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const admin = (request as any).user as JWTPayload;
    const { requestId } = request.params as { requestId: string };
    const { status, adminNote } = request.body as { status: 'APPROVED' | 'DENIED'; adminNote?: string };

    const req = await prisma.usernameChangeRequest.findUnique({ where: { id: requestId } });
    if (!req) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } });
    }

    await prisma.usernameChangeRequest.update({
      where: { id: requestId },
      data: { status, adminNote, reviewedBy: admin.userId, reviewedAt: new Date() },
    });

    if (status === 'APPROVED') {
      await prisma.user.update({
        where: { id: req.userId },
        data: { username: req.requestedUsername, usernameChanged: true },
      });
    }

    return reply.send({ success: true, data: { message: `Request ${status.toLowerCase()}` } });
  });

  // ==================== BADGES ====================
  app.get('/badges', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const badges = await prisma.badge.findMany({ orderBy: { sortOrder: 'asc' } });
    return reply.send({ success: true, data: badges });
  });

  app.post('/badges', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { name, description, icon, color, category } = request.body as any;

    const badge = await prisma.badge.create({
      data: { name, description, icon, color, category },
    });

    return reply.status(201).send({ success: true, data: badge });
  });

  app.post('/badges/:badgeId/award', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const admin = (request as any).user as JWTPayload;
    const { badgeId } = request.params as { badgeId: string };
    const { userId, reason } = request.body as { userId: string; reason?: string };

    await prisma.userBadge.create({
      data: { userId, badgeId, awardedBy: admin.userId, reason },
    });

    await prisma.notification.create({
      data: {
        userId,
        actorId: admin.userId,
        type: 'BADGE',
        title: 'New badge!',
        message: 'You have been awarded a new badge',
        link: '/settings/badges',
      },
    });

    return reply.send({ success: true, data: { message: 'Badge awarded' } });
  });

  // ==================== NOTIFICATION BARS ====================
  app.get('/notification-bars', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const bars = await prisma.notificationBar.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return reply.send({ success: true, data: bars });
  });

  app.post('/notification-bars', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = notificationBarSchema.parse(request.body);

    const bar = await prisma.notificationBar.create({ data: body });
    await cache.del('notification-bars:active');

    return reply.status(201).send({ success: true, data: bar });
  });

  app.put('/notification-bars/:id', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    const bar = await prisma.notificationBar.update({ where: { id }, data: body });
    await cache.del('notification-bars:active');

    return reply.send({ success: true, data: bar });
  });

  app.delete('/notification-bars/:id', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await prisma.notificationBar.delete({ where: { id } });
    await cache.del('notification-bars:active');

    return reply.send({ success: true, data: { message: 'Deleted' } });
  });

  // Get active notification bars (public)
  app.get('/notification-bars/active', async (request: FastifyRequest, reply: FastifyReply) => {
    const cached = await cache.get('notification-bars:active');
    if (cached) return reply.send({ success: true, data: cached });

    const now = new Date();
    const bars = await prisma.notificationBar.findMany({
      where: {
        isActive: true,
        OR: [
          { startsAt: null, endsAt: null },
          { startsAt: { lte: now }, endsAt: null },
          { startsAt: null, endsAt: { gte: now } },
          { startsAt: { lte: now }, endsAt: { gte: now } },
        ],
      },
      orderBy: { sortOrder: 'asc' },
    });

    await cache.set('notification-bars:active', bars, 60);
    return reply.send({ success: true, data: bars });
  });

  // ==================== AUDIT LOGS ====================
  app.get('/audit-logs', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { page = '1', limit = '50', action, userId } = request.query as any;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const where: any = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, username: true } } },
        take: limitNum,
        skip: (pageNum - 1) * limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: logs,
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  });

  // ==================== SITE SETTINGS ====================
  app.get('/settings', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const settings = await prisma.siteSetting.findMany();
    const mapped = settings.reduce((acc: any, s) => { acc[s.key] = s.value; return acc; }, {});
    return reply.send({ success: true, data: mapped });
  });

  app.put('/settings', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as Record<string, string>;

    for (const [key, value] of Object.entries(body)) {
      await prisma.siteSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
    }

    await cache.delPattern('settings:*');
    return reply.send({ success: true, data: { message: 'Settings updated' } });
  });

  // ==================== BAD WORDS ====================
  app.get('/bad-words', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const words = await prisma.badWord.findMany({ orderBy: { word: 'asc' } });
    return reply.send({ success: true, data: words });
  });

  app.post('/bad-words', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { word, replacement, language, severity, isRegex } = request.body as any;

    const badWord = await prisma.badWord.create({
      data: { word, replacement, language, severity, isRegex },
    });

    await cache.del('badwords:all');
    return reply.status(201).send({ success: true, data: badWord });
  });

  app.delete('/bad-words/:id', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    await prisma.badWord.delete({ where: { id } });
    await cache.del('badwords:all');
    return reply.send({ success: true, data: { message: 'Deleted' } });
  });

  // ==================== ANALYTICS ====================
  app.get('/analytics', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { period = '7d' } = request.query as any;
    
    let days = 7;
    if (period === '30d') days = 30;
    if (period === '90d') days = 90;

    const startDate = new Date(Date.now() - days * 86400000);

    const [
      newUsers, newThreads, newComments, topThreads, topUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      prisma.thread.count({ where: { createdAt: { gte: startDate }, deletedAt: null } }),
      prisma.comment.count({ where: { createdAt: { gte: startDate }, deletedAt: null } }),
      prisma.thread.findMany({
        where: { createdAt: { gte: startDate }, deletedAt: null },
        select: { id: true, title: true, slug: true, viewCount: true, commentCount: true },
        orderBy: { viewCount: 'desc' },
        take: 10,
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { id: true, username: true, avatar: true, points: true },
        orderBy: { points: 'desc' },
        take: 10,
      }),
    ]);

    return reply.send({
      success: true,
      data: { period, newUsers, newThreads, newComments, topThreads, topUsers },
    });
  });

  // ==================== MODERATION LOGS ====================
  app.get('/moderation-logs', { preHandler: [requireModerator] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { page = '1', limit = '20' } = request.query as any;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const [logs, total] = await Promise.all([
      prisma.moderationAction.findMany({
        include: {
          user: { select: { id: true, username: true } },
          moderator: { select: { id: true, username: true } },
        },
        take: limitNum,
        skip: (pageNum - 1) * limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.moderationAction.count(),
    ]);

    return reply.send({
      success: true,
      data: logs,
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  });

  // ==================== REPORT CREATION (Public) ====================
  app.post('/reports', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;
    const { targetType, targetId, reason, description } = request.body as any;

    // Rate limit reports
    const existing = await prisma.report.findFirst({
      where: { reporterId: user.userId, targetType, targetId, status: 'PENDING' },
    });

    if (existing) {
      return reply.status(409).send({
        success: false,
        error: { code: 'ALREADY_REPORTED', message: 'You have already reported this' },
      });
    }

    let reportedUserId = null;
    if (targetType === 'THREAD') {
      const thread = await prisma.thread.findUnique({ where: { id: targetId }, select: { authorId: true } });
      reportedUserId = thread?.authorId || null;
    } else if (targetType === 'COMMENT') {
      const comment = await prisma.comment.findUnique({ where: { id: targetId }, select: { authorId: true } });
      reportedUserId = comment?.authorId || null;
    } else if (targetType === 'USER') {
      reportedUserId = targetId;
    }

    const report = await prisma.report.create({
      data: {
        reporterId: user.userId,
        reportedUserId,
        targetType,
        targetId,
        reason,
        description,
      },
    });

    return reply.status(201).send({ success: true, data: report });
  });
}
