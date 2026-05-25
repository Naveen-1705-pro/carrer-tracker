import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { Role } from '../types/db';

export const getPlatformStats = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  const [userCount, resumeCount, appCount, tokenUsage, logs] = await Promise.all([
    prisma.user.count(),
    prisma.resume.count(),
    prisma.application.count(),
    prisma.tokenUsage.aggregate({ _sum: { tokens: true } }),
    prisma.processingLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  res.json({
    users: userCount,
    resumes: resumeCount,
    applications: appCount,
    totalTokens: tokenUsage._sum.tokens || 0,
    recentLogs: logs,
  });
};

export const listUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { resumes: true, applications: true } },
    },
  });
  res.json({ users });
};

export const updateUserRole = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { role } = req.body;
  if (!['USER', 'ADMIN'].includes(role)) throw new AppError('Invalid role');

  const user = await prisma.user.update({
    where: { id: String(req.params.id) },
    data: { role: role as Role },
    select: { id: true, email: true, role: true },
  });
  res.json({ user });
};
