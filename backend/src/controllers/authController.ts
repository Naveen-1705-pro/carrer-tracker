import { Response } from 'express';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { Role } from '../types/db';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const client = googleClientId ? new OAuth2Client(googleClientId) : null;

const sanitizeUser = (user: {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatar: string | null;
  createdAt: Date;
}) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role as Role,
  avatar: user.avatar,
  createdAt: user.createdAt,
});

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password, name } = req.body;
  if (!email || !password) throw new AppError('Email and password are required');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('Email already registered', 409);

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, password: hashed, name: name || email.split('@')[0] },
  });

  const token = signToken({ userId: user.id, email: user.email, role: user.role as Role });
  res.status(201).json({ token, user: sanitizeUser(user) });
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.password) throw new AppError('Invalid credentials', 401);

  const valid = await comparePassword(password, user.password);
  if (!valid) throw new AppError('Invalid credentials', 401);

  const token = signToken({ userId: user.id, email: user.email, role: user.role as Role });
  res.json({ token, user: sanitizeUser(user) });
};

export const googleAuth = async (req: AuthRequest, res: Response): Promise<void> => {
  let { googleId, email, name, avatar, idToken } = req.body;

  if (idToken && googleClientId && client) {
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: googleClientId,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        throw new AppError('Invalid Google token payload', 400);
      }
      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
      avatar = payload.picture;
    } catch (err: any) {
      console.error('Google token verification failed:', err);
      throw new AppError(`Google token verification failed: ${err.message}`, 400);
    }
  } else if (idToken) {
    console.warn('[AUTH] Google Client ID is not configured. idToken verification is skipped; fallback to mock/demo mode.');
  }

  if (!googleId || !email) throw new AppError('Google ID and email are required', 400);

  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId }, { email }] },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { googleId, email, name, avatar, role: Role.USER },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId, name: name || user.name, avatar: avatar || user.avatar },
    });
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role as Role });
  res.json({ token, user: sanitizeUser(user) });
};

export const forgotPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email) throw new AppError('Email is required');

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExp: new Date(Date.now() + 3600000),
      },
    });
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Reset token for ${email}: ${resetToken}`);
    }
  }
  res.json({ message: 'If an account exists, a reset link has been sent.' });
};

export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { token, password } = req.body;
  if (!token || !password) throw new AppError('Token and new password are required');

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExp: { gt: new Date() },
    },
  });
  if (!user) throw new AppError('Invalid or expired reset token', 400);

  const hashed = await hashPassword(password);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, resetToken: null, resetTokenExp: null },
  });
  res.json({ message: 'Password updated successfully' });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) throw new AppError('User not found', 404);
  res.json({ user: sanitizeUser(user) });
};
