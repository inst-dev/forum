import { Server, Socket } from 'socket.io';
import { verifyAccessToken, JWTPayload } from '../lib/auth';
import { cache, redis } from '../lib/redis';
import { prisma } from '@nullforum/database';

const ONLINE_TTL = 300; // 5 minutes
const connectedUsers = new Map<string, Set<string>>();

let ioInstance: Server | null = null;

export function getIO(): Server | null {
  return ioInstance;
}

export function setupSocketIO(io: Server) {
  ioInstance = io;
  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return next(new Error('Invalid token'));
    }

    // Check if session is revoked
    const isRevoked = await redis.get(`nf:revoked:${payload.sessionId}`);
    if (isRevoked) {
      return next(new Error('Session revoked'));
    }

    (socket as any).user = payload;
    next();
  });

  io.on('connection', async (socket: Socket) => {
    const user = (socket as any).user as JWTPayload;
    
    // Track online status
    if (!connectedUsers.has(user.userId)) {
      connectedUsers.set(user.userId, new Set());
    }
    connectedUsers.get(user.userId)!.add(socket.id);

    await cache.set(`online:${user.userId}`, 'true', ONLINE_TTL);
    await prisma.user.update({
      where: { id: user.userId },
      data: { lastSeen: new Date() },
    }).catch(() => {});

    // Join user's personal room
    socket.join(`user:${user.userId}`);

    // Broadcast online status
    socket.broadcast.emit('user:online', {
      userId: user.userId,
      username: user.username,
    });

    // ==================== THREAD EVENTS ====================
    socket.on('thread:join', (threadId: string) => {
      socket.join(`thread:${threadId}`);
    });

    socket.on('thread:leave', (threadId: string) => {
      socket.leave(`thread:${threadId}`);
    });

    socket.on('thread:typing', (data: { threadId: string }) => {
      socket.to(`thread:${data.threadId}`).emit('thread:typing', {
        userId: user.userId,
        username: user.username,
      });
    });

    socket.on('thread:stopTyping', (data: { threadId: string }) => {
      socket.to(`thread:${data.threadId}`).emit('thread:stopTyping', {
        userId: user.userId,
      });
    });

    // ==================== MESSAGE EVENTS ====================
    socket.on('conversation:join', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('message:typing', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('message:typing', {
        userId: user.userId,
        username: user.username,
        conversationId: data.conversationId,
      });
    });

    socket.on('message:stopTyping', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('message:stopTyping', {
        userId: user.userId,
        conversationId: data.conversationId,
      });
    });

    socket.on('message:read', (data: { conversationId: string; messageId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('message:read', {
        userId: user.userId,
        messageId: data.messageId,
        conversationId: data.conversationId,
      });
    });

    // ==================== PRESENCE ====================
    socket.on('heartbeat', async () => {
      await cache.set(`online:${user.userId}`, 'true', ONLINE_TTL);
    });

    // ==================== DISCONNECT ====================
    socket.on('disconnect', async () => {
      const userSockets = connectedUsers.get(user.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          connectedUsers.delete(user.userId);
          await cache.del(`online:${user.userId}`);
          
          await prisma.user.update({
            where: { id: user.userId },
            data: { lastSeen: new Date() },
          }).catch(() => {});

          socket.broadcast.emit('user:offline', {
            userId: user.userId,
            username: user.username,
          });
        }
      }
    });
  });

  // Helper: emit to specific user
  (io as any).emitToUser = (userId: string, event: string, data: any) => {
    io.to(`user:${userId}`).emit(event, data);
  };

  // Helper: emit to thread room
  (io as any).emitToThread = (threadId: string, event: string, data: any) => {
    io.to(`thread:${threadId}`).emit(event, data);
  };

  // Helper: emit to conversation
  (io as any).emitToConversation = (conversationId: string, event: string, data: any) => {
    io.to(`conversation:${conversationId}`).emit(event, data);
  };

  return io;
}

export function getOnlineUsers(): string[] {
  return Array.from(connectedUsers.keys());
}
