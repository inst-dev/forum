import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@nullforum/database';
import { authenticate, JWTPayload } from '../lib/auth';
import { processImage, validateMimeType } from '../lib/upload';
import { rateLimitCache } from '../lib/redis';

export async function uploadRoutes(app: FastifyInstance) {
  // Upload avatar
  app.post('/avatar', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' },
      });
    }

    const buffer = await data.toBuffer();
    
    if (!validateMimeType(data.mimetype)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_TYPE', message: 'Invalid file type. Use JPEG, PNG, GIF, or WebP' },
      });
    }

    const result = await processImage(buffer, data.mimetype, 'avatar', data.filename);

    await prisma.user.update({
      where: { id: user.userId },
      data: { avatar: result.url },
    });

    return reply.send({ success: true, data: { url: result.url } });
  });

  // Upload banner
  app.post('/banner', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' },
      });
    }

    const buffer = await data.toBuffer();
    
    if (!validateMimeType(data.mimetype)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_TYPE', message: 'Invalid file type' },
      });
    }

    const result = await processImage(buffer, data.mimetype, 'banner', data.filename);

    await prisma.user.update({
      where: { id: user.userId },
      data: { banner: result.url },
    });

    return reply.send({ success: true, data: { url: result.url } });
  });

  // Upload attachment
  app.post('/attachment', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;

    // Rate limit
    const count = await rateLimitCache.incr(`upload:${user.userId}`, 60);
    if (count > 10) {
      return reply.status(429).send({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many uploads' },
      });
    }

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' },
      });
    }

    const buffer = await data.toBuffer();
    
    if (!validateMimeType(data.mimetype)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_TYPE', message: 'Invalid file type' },
      });
    }

    const result = await processImage(buffer, data.mimetype, 'attachment', data.filename);

    const attachment = await prisma.attachment.create({
      data: {
        fileName: result.fileName,
        originalName: data.filename,
        mimeType: result.mimeType,
        size: result.size,
        path: result.path,
        url: result.url,
        uploadedBy: user.userId,
      },
    });

    return reply.send({
      success: true,
      data: {
        id: attachment.id,
        url: attachment.url,
        fileName: attachment.originalName,
        size: attachment.size,
      },
    });
  });
}
