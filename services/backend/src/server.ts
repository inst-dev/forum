import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { prisma } from '@nullforum/database';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { forumRoutes } from './routes/forums';
import { threadRoutes } from './routes/threads';
import { commentRoutes } from './routes/comments';
import { messageRoutes } from './routes/messages';
import { notificationRoutes } from './routes/notifications';
import { searchRoutes } from './routes/search';
import { adminRoutes } from './routes/admin';
import { uploadRoutes } from './routes/upload';
import { reactionRoutes } from './routes/reactions';
import { setupSocketIO } from './realtime/socket';
import { redis } from './lib/redis';

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
  trustProxy: true,
  bodyLimit: 10 * 1024 * 1024,
});

async function start() {
  // Security plugins
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", 'ws:', 'wss:'],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'cookie-secret-change-me',
    parseOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    },
  });

  await app.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
    redis,
  });

  await app.register(multipart, {
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
      files: 5,
    },
  });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Public site settings (non-sensitive, for frontend providers)
  app.get('/api/site-settings', async (request, reply) => {
    const settings = await prisma.siteSetting.findMany({
      where: { key: { in: ['site_name', 'site_description', 'site_logo', 'site_favicon', 'primary_color', 'maintenance_mode', 'registration_enabled'] } },
    });
    const mapped = settings.reduce((acc: any, s: any) => { acc[s.key] = s.value; return acc; }, {});
    return reply.send({ success: true, data: mapped });
  });

  // API Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(forumRoutes, { prefix: '/api/forums' });
  await app.register(threadRoutes, { prefix: '/api/threads' });
  await app.register(commentRoutes, { prefix: '/api/comments' });
  await app.register(messageRoutes, { prefix: '/api/messages' });
  await app.register(notificationRoutes, { prefix: '/api/notifications' });
  await app.register(searchRoutes, { prefix: '/api/search' });
  await app.register(adminRoutes, { prefix: '/api/admin' });
  await app.register(uploadRoutes, { prefix: '/api/upload' });
  await app.register(reactionRoutes, { prefix: '/api/reactions' });

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);
    
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.validation,
        },
      });
    }

    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: statusCode === 500 ? 'Internal server error' : error.message,
      },
    });
  });

  // 404 handler
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
    });
  });

  // Socket.IO setup
  const httpServer = createServer(app.server);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  setupSocketIO(io);

  const PORT = parseInt(process.env.API_PORT || '7107');
  const SOCKET_PORT = parseInt(process.env.SOCKET_PORT || '6395');

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    httpServer.listen(SOCKET_PORT, () => {
      console.log(`Socket.IO server running on port ${SOCKET_PORT}`);
    });
    console.log(`API server running on port ${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

export { app };
