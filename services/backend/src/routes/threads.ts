import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@nullforum/database';
import { createThreadSchema, updateThreadSchema } from '@nullforum/shared';
import { authenticate, optionalAuth, requireModerator, JWTPayload } from '../lib/auth';
import { generateSlug } from '@nullforum/shared';
import { filterContent, calculateSpamScore } from '../lib/profanity';
import { cache } from '../lib/redis';

export async function threadRoutes(app: FastifyInstance) {
  // Get thread by slug-shortId format
  app.get('/:slug/:threadId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { slug, threadId } = request.params as { slug: string; threadId: string };

    // Support both formats: direct UUID or shortId (first 8 chars of uuid without hyphens)
    let thread;
    if (threadId.length >= 32) {
      // Full UUID format
      thread = await prisma.thread.findUnique({
        where: { id: threadId },
        include: {
          author: {
            select: {
              id: true, username: true, displayName: true, avatar: true,
              memberStatus: true, role: true, points: true, reactionScore: true,
              signature: true, createdAt: true, isVerified: true,
              badges: { include: { badge: true }, take: 5 },
            },
          },
          forum: { select: { id: true, name: true, slug: true } },
          prefix: { select: { id: true, name: true, color: true } },
          tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
          poll: { include: { options: { orderBy: { sortOrder: 'asc' } } } },
          attachments: { select: { id: true, fileName: true, originalName: true, mimeType: true, size: true, url: true } },
        },
      });
    } else {
      // shortId format - find thread where id starts with normalized shortId
      const normalizedId = threadId.replace(/-/g, '');
      const threads = await prisma.thread.findMany({
        where: { deletedAt: null },
        select: { id: true },
      });
      const match = threads.find(t => t.id.replace(/-/g, '').startsWith(normalizedId));
      if (match) {
        thread = await prisma.thread.findUnique({
          where: { id: match.id },
          include: {
            author: {
              select: {
                id: true, username: true, displayName: true, avatar: true,
                memberStatus: true, role: true, points: true, reactionScore: true,
                signature: true, createdAt: true, isVerified: true,
                badges: { include: { badge: true }, take: 5 },
              },
            },
            forum: { select: { id: true, name: true, slug: true } },
            prefix: { select: { id: true, name: true, color: true } },
            tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
            poll: { include: { options: { orderBy: { sortOrder: 'asc' } } } },
            attachments: { select: { id: true, fileName: true, originalName: true, mimeType: true, size: true, url: true } },
          },
        });
      }
    }

    if (!thread || thread.deletedAt) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Thread not found' },
      });
    }

    // Check if user is shadow banned author
    await optionalAuth(request);
    const currentUser = (request as any).user as JWTPayload | undefined;
    
    if (thread.author && (thread.author as any).isShadowBanned && currentUser?.userId !== thread.authorId) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Thread not found' },
      });
    }

    // Increment view count
    await prisma.thread.update({
      where: { id: threadId },
      data: { viewCount: { increment: 1 } },
    });

    return reply.send({ success: true, data: thread });
  });

  // Create thread
  app.post('/', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;
    const body = createThreadSchema.parse(request.body);

    // Check if user is muted
    const userRecord = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { isMuted: true, mutedUntil: true, isShadowBanned: true },
    });

    if (userRecord?.isMuted && (!userRecord.mutedUntil || userRecord.mutedUntil > new Date())) {
      return reply.status(403).send({
        success: false,
        error: { code: 'MUTED', message: 'Your account is muted' },
      });
    }

    // Profanity filter
    const { filtered: filteredTitle, flagged: titleFlagged } = await filterContent(body.title);
    const { filtered: filteredContent, flagged: contentFlagged, score: spamScore } = await filterContent(body.content);

    // Spam detection
    const totalSpamScore = spamScore + await calculateSpamScore(body.content, user.userId);
    if (totalSpamScore > 10) {
      return reply.status(403).send({
        success: false,
        error: { code: 'SPAM_DETECTED', message: 'Your post was flagged as spam' },
      });
    }

    const slug = generateSlug(body.title);

    const thread = await prisma.thread.create({
      data: {
        title: filteredTitle,
        slug,
        content: filteredContent,
        type: body.type,
        authorId: user.userId,
        forumId: body.forumId,
        prefixId: body.prefixId || null,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        tags: body.tags ? {
          create: await Promise.all(body.tags.map(async (tagName) => {
            const tag = await prisma.tag.upsert({
              where: { name: tagName },
              create: { name: tagName, slug: generateSlug(tagName) },
              update: { usageCount: { increment: 1 } },
            });
            return { tagId: tag.id };
          })),
        } : undefined,
        poll: body.poll ? {
          create: {
            question: body.poll.question,
            allowMultiple: body.poll.allowMultiple,
            expiresAt: body.poll.expiresAt ? new Date(body.poll.expiresAt) : null,
            options: {
              create: body.poll.options.map((opt, idx) => ({
                text: opt,
                sortOrder: idx,
              })),
            },
          },
        } : undefined,
      },
      include: {
        author: { select: { id: true, username: true, avatar: true } },
        forum: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: true } },
      },
    });

    // Update forum stats
    await prisma.forum.update({
      where: { id: body.forumId },
      data: {
        threadCount: { increment: 1 },
        lastThreadId: thread.id,
        lastThreadAt: new Date(),
      },
    });

    // Award points
    await prisma.user.update({
      where: { id: user.userId },
      data: { points: { increment: 5 } },
    });

    // Clear cache
    await cache.delPattern('forums:*');

    return reply.status(201).send({ success: true, data: thread });
  });

  // Update thread
  app.put('/:threadId', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;
    const { threadId } = request.params as { threadId: string };
    const body = updateThreadSchema.parse(request.body);

    const thread = await prisma.thread.findUnique({ where: { id: threadId } });
    if (!thread || thread.deletedAt) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Thread not found' },
      });
    }

    if (thread.authorId !== user.userId && !['ADMIN', 'SUPER_MODERATOR', 'MODERATOR'].includes(user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to edit this thread' },
      });
    }

    // Save revision
    await prisma.threadRevision.create({
      data: {
        threadId,
        title: thread.title,
        content: thread.content,
        editedBy: user.userId,
      },
    });

    const updateData: any = {};
    if (body.title) {
      const { filtered } = await filterContent(body.title);
      updateData.title = filtered;
      updateData.slug = generateSlug(filtered);
    }
    if (body.content) {
      const { filtered } = await filterContent(body.content);
      updateData.content = filtered;
    }
    if (body.prefixId !== undefined) updateData.prefixId = body.prefixId;

    const updated = await prisma.thread.update({
      where: { id: threadId },
      data: updateData,
    });

    return reply.send({ success: true, data: updated });
  });

  // Delete thread (soft)
  app.delete('/:threadId', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;
    const { threadId } = request.params as { threadId: string };

    const thread = await prisma.thread.findUnique({ where: { id: threadId } });
    if (!thread) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Thread not found' },
      });
    }

    if (thread.authorId !== user.userId && !['ADMIN', 'SUPER_MODERATOR', 'MODERATOR'].includes(user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized' },
      });
    }

    await prisma.thread.update({
      where: { id: threadId },
      data: { deletedAt: new Date() },
    });

    await prisma.forum.update({
      where: { id: thread.forumId },
      data: { threadCount: { decrement: 1 } },
    });

    return reply.send({ success: true, data: { message: 'Thread deleted' } });
  });

  // Bookmark thread
  app.post('/:threadId/bookmark', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;
    const { threadId } = request.params as { threadId: string };

    const existing = await prisma.bookmark.findUnique({
      where: { userId_threadId: { userId: user.userId, threadId } },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return reply.send({ success: true, data: { bookmarked: false } });
    }

    await prisma.bookmark.create({
      data: { userId: user.userId, threadId },
    });

    return reply.send({ success: true, data: { bookmarked: true } });
  });

  // Watch thread
  app.post('/:threadId/watch', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;
    const { threadId } = request.params as { threadId: string };

    const existing = await prisma.watchedThread.findUnique({
      where: { userId_threadId: { userId: user.userId, threadId } },
    });

    if (existing) {
      await prisma.watchedThread.delete({ where: { id: existing.id } });
      return reply.send({ success: true, data: { watching: false } });
    }

    await prisma.watchedThread.create({
      data: { userId: user.userId, threadId },
    });

    return reply.send({ success: true, data: { watching: true } });
  });

  // Vote on poll
  app.post('/:threadId/poll/vote', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;
    const { threadId } = request.params as { threadId: string };
    const { optionIds } = request.body as { optionIds: string[] };

    const poll = await prisma.poll.findUnique({
      where: { threadId },
      include: { options: true },
    });

    if (!poll) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Poll not found' },
      });
    }

    if (poll.expiresAt && poll.expiresAt < new Date()) {
      return reply.status(400).send({
        success: false,
        error: { code: 'POLL_EXPIRED', message: 'This poll has expired' },
      });
    }

    // Check existing votes
    const existingVotes = await prisma.pollVote.findMany({
      where: { pollId: poll.id, userId: user.userId },
    });

    if (existingVotes.length > 0) {
      return reply.status(400).send({
        success: false,
        error: { code: 'ALREADY_VOTED', message: 'You have already voted' },
      });
    }

    if (!poll.allowMultiple && optionIds.length > 1) {
      return reply.status(400).send({
        success: false,
        error: { code: 'SINGLE_VOTE', message: 'Only one option allowed' },
      });
    }

    for (const optionId of optionIds) {
      await prisma.pollVote.create({
        data: { pollId: poll.id, optionId, userId: user.userId },
      });
      await prisma.pollOption.update({
        where: { id: optionId },
        data: { voteCount: { increment: 1 } },
      });
    }

    await prisma.poll.update({
      where: { id: poll.id },
      data: { totalVotes: { increment: 1 } },
    });

    return reply.send({ success: true, data: { message: 'Vote recorded' } });
  });

  // Pin/unpin thread (moderator)
  app.post('/:threadId/pin', { preHandler: [requireModerator] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { threadId } = request.params as { threadId: string };

    const thread = await prisma.thread.findUnique({ where: { id: threadId } });
    if (!thread) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Thread not found' } });

    await prisma.thread.update({
      where: { id: threadId },
      data: { isPinned: !thread.isPinned },
    });

    return reply.send({ success: true, data: { pinned: !thread.isPinned } });
  });

  // Lock/unlock thread (moderator)
  app.post('/:threadId/lock', { preHandler: [requireModerator] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { threadId } = request.params as { threadId: string };

    const thread = await prisma.thread.findUnique({ where: { id: threadId } });
    if (!thread) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Thread not found' } });

    await prisma.thread.update({
      where: { id: threadId },
      data: { isLocked: !thread.isLocked, status: thread.isLocked ? 'OPEN' : 'LOCKED' },
    });

    return reply.send({ success: true, data: { locked: !thread.isLocked } });
  });

  // Move thread (moderator)
  app.post('/:threadId/move', { preHandler: [requireModerator] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { threadId } = request.params as { threadId: string };
    const { forumId } = request.body as { forumId: string };

    const thread = await prisma.thread.findUnique({ where: { id: threadId } });
    if (!thread) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Thread not found' } });

    await prisma.thread.update({
      where: { id: threadId },
      data: { forumId },
    });

    // Update forum counts
    await prisma.forum.update({ where: { id: thread.forumId }, data: { threadCount: { decrement: 1 } } });
    await prisma.forum.update({ where: { id: forumId }, data: { threadCount: { increment: 1 } } });

    return reply.send({ success: true, data: { message: 'Thread moved' } });
  });

  // Get thread revisions
  app.get('/:threadId/revisions', async (request: FastifyRequest, reply: FastifyReply) => {
    const { threadId } = request.params as { threadId: string };

    const revisions = await prisma.threadRevision.findMany({
      where: { threadId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return reply.send({ success: true, data: revisions });
  });

  // Get latest threads (for home page)
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { page = '1', limit = '20', sort = 'latest' } = request.query as any;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'popular') orderBy = { viewCount: 'desc' };
    if (sort === 'active') orderBy = { lastCommentAt: 'desc' };

    const [threads, total] = await Promise.all([
      prisma.thread.findMany({
        where: { deletedAt: null, status: { not: 'ARCHIVED' } },
        select: {
          id: true, title: true, slug: true, type: true, status: true,
          viewCount: true, commentCount: true, reactionCount: true,
          isPinned: true, isSticky: true, isLocked: true,
          createdAt: true, lastCommentAt: true,
          author: { select: { id: true, username: true, avatar: true, memberStatus: true } },
          forum: { select: { id: true, name: true, slug: true } },
          prefix: { select: { id: true, name: true, color: true } },
        },
        take: limitNum,
        skip: (pageNum - 1) * limitNum,
        orderBy,
      }),
      prisma.thread.count({ where: { deletedAt: null } }),
    ]);

    return reply.send({
      success: true,
      data: threads,
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum), hasNext: pageNum * limitNum < total, hasPrev: pageNum > 1 },
    });
  });

  // Save/update draft
  app.post('/drafts', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;
    const { id, forumId, title, content, type } = request.body as any;

    if (id) {
      const draft = await prisma.threadDraft.update({
        where: { id },
        data: { forumId, title, content, type },
      });
      return reply.send({ success: true, data: draft });
    }

    const draft = await prisma.threadDraft.create({
      data: { userId: user.userId, forumId, title, content, type },
    });

    return reply.status(201).send({ success: true, data: draft });
  });

  // Get user drafts
  app.get('/drafts', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;

    const drafts = await prisma.threadDraft.findMany({
      where: { userId: user.userId },
      orderBy: { updatedAt: 'desc' },
    });

    return reply.send({ success: true, data: drafts });
  });

  // Delete draft
  app.delete('/drafts/:draftId', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;
    const { draftId } = request.params as { draftId: string };

    await prisma.threadDraft.deleteMany({
      where: { id: draftId, userId: user.userId },
    });

    return reply.send({ success: true, data: { message: 'Draft deleted' } });
  });
}
