import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@nullforum/database';
import { authenticate, requireAdmin, JWTPayload } from '../lib/auth';
import { createForumSchema, createCategorySchema } from '@nullforum/shared';
import { generateSlug } from '@nullforum/shared';
import { cache } from '../lib/redis';

export async function forumRoutes(app: FastifyInstance) {
  // Get all categories with forums
  app.get('/categories', async (request: FastifyRequest, reply: FastifyReply) => {
    const cached = await cache.get('forums:categories');
    if (cached) return reply.send({ success: true, data: cached });

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        forums: {
          where: { isActive: true, parentId: null },
          include: {
            children: {
              where: { isActive: true },
              select: { id: true, name: true, slug: true, description: true, icon: true, threadCount: true, commentCount: true },
              orderBy: { sortOrder: 'asc' },
            },
            _count: { select: { threads: { where: { deletedAt: null } } } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const data = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      slug: cat.slug,
      forums: cat.forums.map(f => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        description: f.description,
        icon: f.icon,
        threadCount: f._count.threads,
        commentCount: f.commentCount,
        lastThreadAt: f.lastThreadAt,
        children: f.children,
      })),
    }));

    await cache.set('forums:categories', data, 60);
    return reply.send({ success: true, data });
  });

  // Get single forum
  app.get('/:slug', async (request: FastifyRequest, reply: FastifyReply) => {
    const { slug } = request.params as { slug: string };

    const forum = await prisma.forum.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          where: { isActive: true },
          select: { id: true, name: true, slug: true, description: true, icon: true, threadCount: true },
          orderBy: { sortOrder: 'asc' },
        },
        prefixes: { select: { id: true, name: true, color: true } },
      },
    });

    if (!forum || !forum.isActive) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Forum not found' },
      });
    }

    return reply.send({ success: true, data: forum });
  });

  // Get threads in forum
  app.get('/:slug/threads', async (request: FastifyRequest, reply: FastifyReply) => {
    const { slug } = request.params as { slug: string };
    const { page = '1', limit = '20', sort = 'latest', prefix } = request.query as any;

    const forum = await prisma.forum.findUnique({ where: { slug } });
    if (!forum) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Forum not found' },
      });
    }

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const where: any = { forumId: forum.id, deletedAt: null };
    if (prefix) where.prefixId = prefix;

    let orderBy: any = [{ isPinned: 'desc' }, { isSticky: 'desc' }, { createdAt: 'desc' }];
    if (sort === 'latest') orderBy = [{ isPinned: 'desc' }, { isSticky: 'desc' }, { createdAt: 'desc' }];
    if (sort === 'newest') orderBy = [{ isPinned: 'desc' }, { createdAt: 'desc' }];
    if (sort === 'views') orderBy = [{ isPinned: 'desc' }, { viewCount: 'desc' }];
    if (sort === 'replies') orderBy = [{ isPinned: 'desc' }, { commentCount: 'desc' }];

    const [threads, total] = await Promise.all([
      prisma.thread.findMany({
        where,
        select: {
          id: true, title: true, slug: true, type: true, status: true,
          viewCount: true, commentCount: true, reactionCount: true,
          isPinned: true, isSticky: true, isLocked: true,
          createdAt: true, lastCommentAt: true,
          author: { select: { id: true, username: true, avatar: true, memberStatus: true } },
          prefix: { select: { id: true, name: true, color: true } },
          tags: { include: { tag: { select: { name: true, slug: true } } } },
        },
        take: limitNum,
        skip: (pageNum - 1) * limitNum,
        orderBy,
      }),
      prisma.thread.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: threads,
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum), hasNext: pageNum * limitNum < total, hasPrev: pageNum > 1 },
    });
  });

  // Create category (admin)
  app.post('/categories', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createCategorySchema.parse(request.body);
    const slug = generateSlug(body.name);

    const category = await prisma.category.create({
      data: { ...body, slug },
    });

    await cache.del('forums:categories');
    return reply.status(201).send({ success: true, data: category });
  });

  // Create forum (admin)
  app.post('/', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createForumSchema.parse(request.body);
    const slug = generateSlug(body.name);

    const forum = await prisma.forum.create({
      data: { ...body, slug },
    });

    await cache.del('forums:categories');
    return reply.status(201).send({ success: true, data: forum });
  });

  // Update forum (admin)
  app.put('/:id', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    const forum = await prisma.forum.update({
      where: { id },
      data: body,
    });

    await cache.del('forums:categories');
    return reply.send({ success: true, data: forum });
  });

  // Delete forum (admin)
  app.delete('/:id', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    await prisma.forum.update({
      where: { id },
      data: { isActive: false },
    });

    await cache.del('forums:categories');
    return reply.send({ success: true, data: { message: 'Forum deactivated' } });
  });

  // Create thread prefix (admin)
  app.post('/:forumId/prefixes', { preHandler: [requireAdmin] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { forumId } = request.params as { forumId: string };
    const { name, color } = request.body as { name: string; color: string };

    const prefix = await prisma.threadPrefix.create({
      data: { name, color, forumId },
    });

    return reply.status(201).send({ success: true, data: prefix });
  });
}
