import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@nullforum/database';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '@nullforum/shared';
import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken, verifyRefreshToken, authenticate, JWTPayload } from '../lib/auth';
import { sendVerificationEmail, sendPasswordResetEmail, sendLoginAlertEmail, sendWelcomeEmail } from '../lib/email';
import { cache, rateLimitCache } from '../lib/redis';
import { randomUUID } from 'crypto';
import { generateUsername, generateToken } from '@nullforum/shared';

export async function authRoutes(app: FastifyInstance) {
  // Register
  app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = registerSchema.parse(request.body);

    // Check rate limit
    const ip = request.ip;
    const attempts = await rateLimitCache.incr(`register:${ip}`, 3600);
    if (attempts > 5) {
      return reply.status(429).send({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many registration attempts' },
      });
    }

    // Check existing email/username
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: body.email }, { username: body.username }] },
    });

    if (existing) {
      const field = existing.email === body.email ? 'email' : 'username';
      return reply.status(409).send({
        success: false,
        error: { code: 'CONFLICT', message: `This ${field} is already registered` },
      });
    }

    const passwordHash = await hashPassword(body.password);
    const emailVerifyToken = generateToken(64);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        username: body.username,
        firstName: body.firstName,
        lastName: body.lastName,
        displayName: `${body.firstName} ${body.lastName}`,
        passwordHash,
        emailVerifyToken,
        privacySettings: { create: {} },
        notificationPrefs: { create: {} },
      },
    });

    await sendVerificationEmail(body.email, body.username, emailVerifyToken);
    await sendWelcomeEmail(body.email, body.username);

    // Create session
    const sessionId = randomUUID();
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      sessionId,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        token: accessToken,
        refreshToken,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] || null,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    reply
      .setCookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400,
        path: '/',
      })
      .setCookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 31536000,
        path: '/',
      });

    return reply.status(201).send({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
        accessToken,
        refreshToken,
      },
    });
  });

  // Login
  app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = loginSchema.parse(request.body);

    const ip = request.ip;
    const attempts = await rateLimitCache.incr(`login:${ip}`, 900);
    if (attempts > 10) {
      return reply.status(429).send({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again later.' },
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      select: {
        id: true, email: true, username: true, displayName: true, avatar: true,
        passwordHash: true, role: true, isBanned: true, isSuspended: true,
        suspendedUntil: true, twoFactorEnabled: true, isEmailVerified: true, deletedAt: true,
      },
    });

    if (!user || user.deletedAt || !user.passwordHash) {
      await prisma.loginHistory.create({
        data: { userId: user?.id || 'unknown', ipAddress: ip, userAgent: request.headers['user-agent'], success: false, failReason: 'Invalid credentials' },
      }).catch(() => {});
      return reply.status(401).send({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    if (user.isBanned) {
      return reply.status(403).send({
        success: false,
        error: { code: 'ACCOUNT_BANNED', message: 'Your account has been banned' },
      });
    }

    if (user.isSuspended && user.suspendedUntil && user.suspendedUntil > new Date()) {
      return reply.status(403).send({
        success: false,
        error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account is suspended' },
      });
    }

    const validPassword = await verifyPassword(body.password, user.passwordHash);
    if (!validPassword) {
      await prisma.loginHistory.create({
        data: { userId: user.id, ipAddress: ip, userAgent: request.headers['user-agent'], success: false, failReason: 'Wrong password' },
      });
      return reply.status(401).send({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    // Create session
    const sessionId = randomUUID();
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      sessionId,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        token: accessToken,
        refreshToken,
        ipAddress: ip,
        userAgent: request.headers['user-agent'] || null,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.loginHistory.create({
      data: { userId: user.id, ipAddress: ip, userAgent: request.headers['user-agent'], success: true },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date(), lastLoginIp: ip, loginCount: { increment: 1 } },
    });

    // Send login alert
    await sendLoginAlertEmail(user.email, user.username, ip, request.headers['user-agent'] || 'Unknown');

    reply
      .setCookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400,
        path: '/',
      })
      .setCookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 31536000,
        path: '/',
      });

    return reply.send({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
        accessToken,
        refreshToken,
      },
    });
  });

  // Refresh Token
  app.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies?.refresh_token || (request.body as any)?.refreshToken;
    
    if (!token) {
      return reply.status(401).send({
        success: false,
        error: { code: 'NO_TOKEN', message: 'Refresh token required' },
      });
    }

    const payload = verifyRefreshToken(token);
    if (!payload) {
      return reply.status(401).send({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' },
      });
    }

    // Verify session exists
    const session = await prisma.session.findFirst({
      where: { refreshToken: token, isActive: true },
    });

    if (!session) {
      return reply.status(401).send({
        success: false,
        error: { code: 'SESSION_INVALID', message: 'Session not found' },
      });
    }

    // Rotate tokens
    const newSessionId = randomUUID();
    const newPayload: JWTPayload = {
      userId: payload.userId,
      email: payload.email,
      username: payload.username,
      role: payload.role,
      sessionId: newSessionId,
    };

    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    // Invalidate old session and create new
    await prisma.session.update({
      where: { id: session.id },
      data: { isActive: false },
    });

    await prisma.session.create({
      data: {
        id: newSessionId,
        userId: payload.userId,
        token: newAccessToken,
        refreshToken: newRefreshToken,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] || null,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    reply
      .setCookie('access_token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 900,
        path: '/',
      })
      .setCookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 604800,
        path: '/',
      });

    return reply.send({
      success: true,
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    });
  });

  // Logout
  app.post('/logout', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;
    
    await prisma.session.updateMany({
      where: { id: user.sessionId },
      data: { isActive: false },
    });

    // Revoke session in Redis
    await cache.set(`revoked:${user.sessionId}`, 'true', 86400);

    reply
      .clearCookie('access_token', { path: '/' })
      .clearCookie('refresh_token', { path: '/' });

    return reply.send({ success: true, data: { message: 'Logged out successfully' } });
  });

  // Logout everywhere
  app.post('/logout-all', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as JWTPayload;

    const sessions = await prisma.session.findMany({
      where: { userId: user.userId, isActive: true },
    });

    await prisma.session.updateMany({
      where: { userId: user.userId },
      data: { isActive: false },
    });

    // Revoke all sessions in Redis
    for (const session of sessions) {
      await cache.set(`revoked:${session.id}`, 'true', 86400);
    }

    reply
      .clearCookie('access_token', { path: '/' })
      .clearCookie('refresh_token', { path: '/' });

    return reply.send({ success: true, data: { message: 'Logged out from all devices' } });
  });

  // Verify Email
  app.post('/verify-email', async (request: FastifyRequest, reply: FastifyReply) => {
    const { token } = request.body as { token: string };

    if (!token) {
      return reply.status(400).send({
        success: false,
        error: { code: 'MISSING_TOKEN', message: 'Verification token required' },
      });
    }

    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid verification token' },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerifyToken: null, isVerified: true },
    });

    return reply.send({ success: true, data: { message: 'Email verified successfully' } });
  });

  // Forgot Password
  app.post('/forgot-password', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = forgotPasswordSchema.parse(request.body);

    const ip = request.ip;
    const attempts = await rateLimitCache.incr(`forgot:${ip}`, 3600);
    if (attempts > 3) {
      return reply.status(429).send({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many requests' },
      });
    }

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return reply.send({ success: true, data: { message: 'If the email exists, a reset link has been sent' } });
    }

    const resetToken = generateToken(64);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: new Date(Date.now() + 3600000),
      },
    });

    await sendPasswordResetEmail(user.email, user.username, resetToken);

    return reply.send({ success: true, data: { message: 'If the email exists, a reset link has been sent' } });
  });

  // Reset Password
  app.post('/reset-password', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = resetPasswordSchema.parse(request.body);

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: body.token,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired reset token' },
      });
    }

    const passwordHash = await hashPassword(body.password);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetToken: null, passwordResetExpiry: null },
    });

    // Invalidate all sessions
    await prisma.session.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });

    return reply.send({ success: true, data: { message: 'Password reset successfully' } });
  });

  // Get current user
  app.get('/me', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = (request as any).user as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, username: true, email: true, displayName: true, firstName: true,
        lastName: true, avatar: true, banner: true, bio: true, role: true,
        memberStatus: true, points: true, reactionScore: true, level: true,
        isVerified: true, isEmailVerified: true, language: true, theme: true,
        createdAt: true, lastSeen: true,
      },
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    return reply.send({ success: true, data: user });
  });

  // Get sessions
  app.get('/sessions', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = (request as any).user as JWTPayload;

    const sessions = await prisma.session.findMany({
      where: { userId, isActive: true },
      select: {
        id: true, deviceInfo: true, ipAddress: true, lastUsed: true, createdAt: true,
      },
      orderBy: { lastUsed: 'desc' },
    });

    return reply.send({ success: true, data: sessions });
  });

  // Revoke session
  app.delete('/sessions/:sessionId', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = (request as any).user as JWTPayload;
    const { sessionId } = request.params as { sessionId: string };

    await prisma.session.updateMany({
      where: { id: sessionId, userId },
      data: { isActive: false },
    });

    await cache.set(`revoked:${sessionId}`, 'true', 86400);

    return reply.send({ success: true, data: { message: 'Session revoked' } });
  });

  // Get socket auth token (returns access token for WebSocket connection)
  app.get('/socket-token', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies?.access_token;
    if (!token) {
      return reply.status(401).send({ success: false, error: { code: 'NO_TOKEN', message: 'No token' } });
    }
    return reply.send({ success: true, data: { token } });
  });
}
