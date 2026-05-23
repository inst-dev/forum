import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@nullforum/database';
import { redis } from './redis';

const JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret-change-me';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'jwt-refresh-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
  sessionId: string;
}

export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: 900 });
}

export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: 604800 });
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;
  const cookieToken = request.cookies?.access_token;
  
  const token = authHeader?.replace('Bearer ', '') || cookieToken;
  
  if (!token) {
    reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
    return;
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    reply.status(401).send({
      success: false,
      error: { code: 'TOKEN_EXPIRED', message: 'Token expired or invalid' },
    });
    return;
  }

  // Check if session is revoked
  const isRevoked = await redis.get(`revoked:${payload.sessionId}`);
  if (isRevoked) {
    reply.status(401).send({
      success: false,
      error: { code: 'SESSION_REVOKED', message: 'Session has been revoked' },
    });
    return;
  }

  // Check if user is banned
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { isBanned: true, isSuspended: true, suspendedUntil: true, deletedAt: true },
  });

  if (!user || user.deletedAt || user.isBanned) {
    reply.status(403).send({
      success: false,
      error: { code: 'ACCOUNT_DISABLED', message: 'Account is disabled' },
    });
    return;
  }

  if (user.isSuspended && user.suspendedUntil && user.suspendedUntil > new Date()) {
    reply.status(403).send({
      success: false,
      error: { code: 'ACCOUNT_SUSPENDED', message: 'Account is suspended' },
    });
    return;
  }

  (request as any).user = payload;
}

export async function optionalAuth(request: FastifyRequest): Promise<void> {
  const authHeader = request.headers.authorization;
  const cookieToken = request.cookies?.access_token;
  const token = authHeader?.replace('Bearer ', '') || cookieToken;
  
  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      (request as any).user = payload;
    }
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  await authenticate(request, reply);
  const user = (request as any).user as JWTPayload;
  if (!user || user.role !== 'ADMIN') {
    reply.status(403).send({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Admin access required' },
    });
  }
}

export async function requireModerator(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  await authenticate(request, reply);
  const user = (request as any).user as JWTPayload;
  if (!user || !['ADMIN', 'SUPER_MODERATOR', 'MODERATOR'].includes(user.role)) {
    reply.status(403).send({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Moderator access required' },
    });
  }
}
