import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@nullforum/database';
import { updateProfileSchema, privacySettingsSchema, notificationPrefsSchema, changePasswordSchema, usernameChangeRequestSchema } from '@nullforum/shared';
import { authenticate, hashPassword, verifyPassword, JWTPayload } from '../lib/auth';
import { cache } from '../lib/redis';

export async function userRoutes(app: FastifyInstance) {
  // Get user profile (public)
  app.get('/:username', async (request: FastifyRequest, reply: FastifyReply) => {
    const { username } = request.params as { username: string };

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        privacySettings: true,
        badges: { include: { badge: true } },
      },
    });

    if (!user || user.deletedAt) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    // Check privacy settings
    if (user.privacySettings?.hideProfile) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    const threadCount = await prisma.thread.count({ where: { authorId: user.id, deletedAt: null } });
    const commentCount = await prisma.comment.count({ where: { authorId: user.id, deletedAt: null } });
    const followerCount = await prisma.follow.count({ where: { followingId: user.id } });
    const followingCount = await prisma.follow.count({ where: { followerId: user.id } });

    const profile: any = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      banner: user.banner,
      bio: user.bio,
      signature: user.signature,
      statusMessage: user.statusMessage,
      location: user.location,
      memberStatus: user.memberStatus,
      role: user.role,
      points: user.points,
      reactionScore: user.reactionScore,
      level: user.level,
      isVerified: user.isVerified,
      badges: user.badges.map(ub => ({
        id: ub.badge.id,
        name: ub.badge.name,
        icon: ub.badge.icon,
        color: ub.badge.color,
        description: ub.badge.description,
      })),
      threadCount,
      commentCount,
      joinedAt: user.createdAt,
      socialLinks: {
        website: user.website,
        twitter: user.twitter,
        github: user.github,
        discord: user.discord,
        youtube: user.youtube,
      },
    };

    // Respect privacy for certain fields
    if (!user.privacySettings?.hideFollowers) {
      profile.followerCount = followerCount;
      profile.followingCount = followingCount;
    }
    if (!user.privacySettings?.hideLastSeen) {
      profile.lastSeen = user.lastSeen;
    }
    if (!user.privacySettings?.hideOnlineStatus) {
      const online = await cache.get(`online:${user.id}`);
      profile.isOnline = !!online;
    }
    if (!user.privacySettings?.hideBirthdate) {
      profile.birthdate = user.birthdate;
    }

    return reply.send({ success: true, data: profile });
  });

  // Update profile
  app.put('/profile', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = (request as any).user as JWTPayload;
    const body = updateProfileSchema.parse(request.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: body,
      select: {
        id: true, username: true, displayName: true, bio: true, signature: true,
        statusMessage: true, location: true, website: true, twitter: true,
        github: true, discord: true, youtube: true, birthdate: true, language: true,
      },
    });

    await cache.del(`user:${userId}`);

    return reply.send({ success: true, data: user });
  });

  // Change password
  app.put('/password', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = (request as any).user as JWTPayload;
    const body = changePasswordSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return reply.status(400).send({
        success: false,
        error: { code: 'NO_PASSWORD', message: 'No password set for this account' },
      });
    }

    const valid = await verifyPassword(body.currentPassword, user.passwordHash);
    if (!valid) {
      return reply.status(400).send({
        success: false,
        error: { code: 'WRONG_PASSWORD', message: 'Current password is incorrect' },
      });
    }

    const hash = await hashPassword(body.newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hash },
    });

    return reply.send({ success: true, data: { message: 'Password changed successfully' } });
  });

  // Get privacy settings
  app.get('/privacy', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = (request as any).user as JWTPayload;

    const settings = await prisma.privacySettings.findUnique({
      where: { userId },
    });

    return reply.send({ success: true, data: settings });
  });

  // Update privacy settings
  app.put('/privacy', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = (request as any).user as JWTPayload;
    const body = privacySettingsSchema.parse(request.body);

    const settings = await prisma.privacySettings.upsert({
      where: { userId },
      update: body,
      create: { userId, ...body },
    });

    return reply.send({ success: true, data: settings });
  });

  // Get notification preferences
  app.get('/notification-prefs', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = (request as any).user as JWTPayload;

    const prefs = await prisma.notificationPrefs.findUnique({
      where: { userId },
    });

    return reply.send({ success: true, data: prefs });
  });

  // Update notification preferences
  app.put('/notification-prefs', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = (request as any).user as JWTPayload;
    const body = notificationPrefsSchema.parse(request.body);

    const prefs = await prisma.notificationPrefs.upsert({
      where: { userId },
      update: body,
      create: { userId, ...body },
    });

    return reply.send({ success: true, data: prefs });
  });

  // Follow user
  app.post('/:userId/follow', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const currentUser = (request as any).user as JWTPayload;
    const { userId } = request.params as { userId: string };

    if (currentUser.userId === userId) {
      return reply.status(400).send({
        success: false,
        error: { code: 'SELF_FOLLOW', message: 'Cannot follow yourself' },
      });
    }

    // Check if blocked
    const blocked = await prisma.block.findFirst({
      where: { OR: [{ blockerId: userId, blockedId: currentUser.userId }, { blockerId: currentUser.userId, blockedId: userId }] },
    });
    if (blocked) {
      return reply.status(403).send({
        success: false,
        error: { code: 'BLOCKED', message: 'Cannot follow this user' },
      });
    }

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: currentUser.userId, followingId: userId } },
    });

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      return reply.send({ success: true, data: { following: false } });
    }

    await prisma.follow.create({
      data: { followerId: currentUser.userId, followingId: userId },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        actorId: currentUser.userId,
        type: 'FOLLOW',
        title: 'New follower',
        message: `${currentUser.username} started following you`,
        link: `/users/${currentUser.username}`,
      },
    });

    return reply.send({ success: true, data: { following: true } });
  });

  // Block user
  app.post('/:userId/block', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const currentUser = (request as any).user as JWTPayload;
    const { userId } = request.params as { userId: string };

    if (currentUser.userId === userId) {
      return reply.status(400).send({
        success: false,
        error: { code: 'SELF_BLOCK', message: 'Cannot block yourself' },
      });
    }

    const existing = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: currentUser.userId, blockedId: userId } },
    });

    if (existing) {
      await prisma.block.delete({ where: { id: existing.id } });
      return reply.send({ success: true, data: { blocked: false } });
    }

    await prisma.block.create({
      data: { blockerId: currentUser.userId, blockedId: userId },
    });

    // Remove follow relationship
    await prisma.follow.deleteMany({
      where: { OR: [{ followerId: currentUser.userId, followingId: userId }, { followerId: userId, followingId: currentUser.userId }] },
    });

    return reply.send({ success: true, data: { blocked: true } });
  });

  // Get followers
  app.get('/:userId/followers', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.params as { userId: string };
    const { page = '1', limit = '20' } = request.query as { page?: string; limit?: string };

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const [followers, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: userId },
        include: { follower: { select: { id: true, username: true, displayName: true, avatar: true, memberStatus: true } } },
        take: limitNum,
        skip: (pageNum - 1) * limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follow.count({ where: { followingId: userId } }),
    ]);

    return reply.send({
      success: true,
      data: followers.map(f => f.follower),
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  });

  // Get following
  app.get('/:userId/following', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.params as { userId: string };
    const { page = '1', limit = '20' } = request.query as { page?: string; limit?: string };

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const [following, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId },
        include: { following: { select: { id: true, username: true, displayName: true, avatar: true, memberStatus: true } } },
        take: limitNum,
        skip: (pageNum - 1) * limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return reply.send({
      success: true,
      data: following.map(f => f.following),
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  });

  // Username change request
  app.post('/username-change-request', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId, username } = (request as any).user as JWTPayload;
    const body = usernameChangeRequestSchema.parse(request.body);

    // Check if username already exists
    const existing = await prisma.user.findUnique({ where: { username: body.requestedUsername } });
    if (existing) {
      return reply.status(409).send({
        success: false,
        error: { code: 'USERNAME_TAKEN', message: 'This username is already taken' },
      });
    }

    // Check for pending request
    const pending = await prisma.usernameChangeRequest.findFirst({
      where: { userId, status: 'PENDING' },
    });
    if (pending) {
      return reply.status(409).send({
        success: false,
        error: { code: 'REQUEST_EXISTS', message: 'You already have a pending request' },
      });
    }

    await prisma.usernameChangeRequest.create({
      data: {
        userId,
        currentUsername: username,
        requestedUsername: body.requestedUsername,
        reason: body.reason,
      },
    });

    return reply.status(201).send({
      success: true,
      data: { message: 'Username change request submitted. An admin will review it.' },
    });
  });

  // Get members list
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { page = '1', limit = '20', sort = 'newest' } = request.query as { page?: string; limit?: string; sort?: string };

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'points') orderBy = { points: 'desc' };
    if (sort === 'reactions') orderBy = { reactionScore: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { deletedAt: null, isBanned: false },
        select: {
          id: true, username: true, displayName: true, avatar: true,
          memberStatus: true, role: true, points: true, reactionScore: true,
          createdAt: true, isVerified: true,
        },
        take: limitNum,
        skip: (pageNum - 1) * limitNum,
        orderBy,
      }),
      prisma.user.count({ where: { deletedAt: null, isBanned: false } }),
    ]);

    return reply.send({
      success: true,
      data: users,
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  });

  // Update theme
  app.put('/theme', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = (request as any).user as JWTPayload;
    const { theme } = request.body as { theme: string };

    if (!['light', 'dark', 'system'].includes(theme)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_THEME', message: 'Invalid theme value' },
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { theme },
    });

    return reply.send({ success: true, data: { theme } });
  });

  // Get bookmarks
  app.get('/bookmarks', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = (request as any).user as JWTPayload;
    const { page = '1', limit = '20' } = request.query as { page?: string; limit?: string };

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId },
        include: {
          thread: {
            select: { id: true, title: true, slug: true, createdAt: true, commentCount: true, viewCount: true,
              author: { select: { username: true, avatar: true } },
              forum: { select: { name: true, slug: true } },
            },
          },
        },
        take: limitNum,
        skip: (pageNum - 1) * limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bookmark.count({ where: { userId } }),
    ]);

    return reply.send({
      success: true,
      data: bookmarks.map(b => b.thread),
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  });

  // Get watched threads
  app.get('/watched-threads', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = (request as any).user as JWTPayload;
    const { page = '1', limit = '20' } = request.query as { page?: string; limit?: string };

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const [watched, total] = await Promise.all([
      prisma.watchedThread.findMany({
        where: { userId },
        include: {
          thread: {
            select: { id: true, title: true, slug: true, createdAt: true, commentCount: true,
              author: { select: { username: true, avatar: true } },
              forum: { select: { name: true, slug: true } },
            },
          },
        },
        take: limitNum,
        skip: (pageNum - 1) * limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.watchedThread.count({ where: { userId } }),
    ]);

    return reply.send({
      success: true,
      data: watched.map(w => w.thread),
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  });
}
