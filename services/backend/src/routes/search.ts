import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@nullforum/database';
import { searchSchema } from '@nullforum/shared';
import { optionalAuth, JWTPayload } from '../lib/auth';
import { rateLimitCache } from '../lib/redis';

export async function searchRoutes(app: FastifyInstance) {
  // Global search
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = searchSchema.parse(request.query);

    // Rate limit search
    const ip = request.ip;
    const searchCount = await rateLimitCache.incr(`search:${ip}`, 60);
    if (searchCount > 20) {
      return reply.status(429).send({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many searches' },
      });
    }

    const results: any = { threads: [], comments: [], users: [], forums: [] };
    const skip = (query.page - 1) * query.limit;

    if (query.type === 'all' || query.type === 'threads') {
      const where: any = {
        deletedAt: null,
        OR: [
          { title: { contains: query.query } },
          { content: { contains: query.query } },
        ],
      };
      if (query.forumId) where.forumId = query.forumId;
      if (query.authorId) where.authorId = query.authorId;
      if (query.dateFrom) where.createdAt = { ...(where.createdAt || {}), gte: new Date(query.dateFrom) };
      if (query.dateTo) where.createdAt = { ...(where.createdAt || {}), lte: new Date(query.dateTo) };

      let orderBy: any = { createdAt: 'desc' };
      if (query.sortBy === 'views') orderBy = { viewCount: 'desc' };
      if (query.sortBy === 'replies') orderBy = { commentCount: 'desc' };

      const [threads, total] = await Promise.all([
        prisma.thread.findMany({
          where,
          select: {
            id: true, title: true, slug: true, type: true, viewCount: true,
            commentCount: true, createdAt: true,
            author: { select: { id: true, username: true, avatar: true } },
            forum: { select: { id: true, name: true, slug: true } },
          },
          take: query.limit,
          skip,
          orderBy,
        }),
        prisma.thread.count({ where }),
      ]);

      results.threads = threads;
      results.threadTotal = total;
    }

    if (query.type === 'all' || query.type === 'comments') {
      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where: {
            content: { contains: query.query },
            deletedAt: null,
          },
          select: {
            id: true, content: true, createdAt: true,
            author: { select: { id: true, username: true, avatar: true } },
            thread: { select: { id: true, title: true, slug: true } },
          },
          take: query.limit,
          skip,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.comment.count({ where: { content: { contains: query.query }, deletedAt: null } }),
      ]);

      results.comments = comments;
      results.commentTotal = total;
    }

    if (query.type === 'all' || query.type === 'users') {
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: {
            deletedAt: null,
            isBanned: false,
            OR: [
              { username: { contains: query.query } },
              { displayName: { contains: query.query } },
            ],
            privacySettings: { hideProfile: false },
          },
          select: {
            id: true, username: true, displayName: true, avatar: true,
            memberStatus: true, createdAt: true,
          },
          take: query.limit,
          skip,
        }),
        prisma.user.count({
          where: {
            deletedAt: null,
            isBanned: false,
            OR: [
              { username: { contains: query.query } },
              { displayName: { contains: query.query } },
            ],
          },
        }),
      ]);

      results.users = users;
      results.userTotal = total;
    }

    if (query.type === 'all' || query.type === 'forums') {
      const [forums, total] = await Promise.all([
        prisma.forum.findMany({
          where: {
            isActive: true,
            OR: [
              { name: { contains: query.query } },
              { description: { contains: query.query } },
            ],
          },
          select: {
            id: true, name: true, slug: true, description: true,
            threadCount: true, commentCount: true,
          },
          take: query.limit,
          skip,
        }),
        prisma.forum.count({
          where: {
            isActive: true,
            OR: [{ name: { contains: query.query } }, { description: { contains: query.query } }],
          },
        }),
      ]);

      results.forums = forums;
      results.forumTotal = total;
    }

    return reply.send({
      success: true,
      data: results,
      meta: { query: query.query, page: query.page, limit: query.limit },
    });
  });

  // Search suggestions (autocomplete)
  app.get('/suggestions', async (request: FastifyRequest, reply: FastifyReply) => {
    const { q } = request.query as { q: string };

    if (!q || q.length < 2) {
      return reply.send({ success: true, data: [] });
    }

    const [threads, users] = await Promise.all([
      prisma.thread.findMany({
        where: { title: { contains: q }, deletedAt: null },
        select: { id: true, title: true, slug: true },
        take: 5,
      }),
      prisma.user.findMany({
        where: { username: { startsWith: q }, deletedAt: null, isBanned: false },
        select: { id: true, username: true, avatar: true },
        take: 5,
      }),
    ]);

    const suggestions = [
      ...threads.map(t => ({ type: 'thread' as const, id: t.id, text: t.title, url: `/${t.slug}/${t.id}` })),
      ...users.map(u => ({ type: 'user' as const, id: u.id, text: u.username, url: `/users/${u.username}`, avatar: u.avatar })),
    ];

    return reply.send({ success: true, data: suggestions });
  });
}
