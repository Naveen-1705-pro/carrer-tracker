import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { AppStatus } from '../types/db';

export const listApplications = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const apps = await prisma.application.findMany({
    where: { userId: req.user!.userId },
    orderBy: { updatedAt: 'desc' },
  });
  res.json({ applications: apps });
};

export const createApplication = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const {
    companyName,
    jobTitle,
    jobDescription,
    status,
    matchPercentage,
    notes,
  } = req.body;
  if (!companyName || !jobTitle) {
    throw new AppError('companyName and jobTitle are required');
  }

  const app = await prisma.application.create({
    data: {
      userId: req.user!.userId,
      companyName,
      jobTitle,
      jobDescription,
      status: (status as AppStatus) || AppStatus.APPLIED,
      matchPercentage,
      notes,
    },
  });
  res.status(201).json({ application: app });
};

export const updateApplication = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = String(req.params.id);
  const existing = await prisma.application.findFirst({
    where: { id, userId: req.user!.userId },
  });
  if (!existing) throw new AppError('Application not found', 404);

  const { status, notes, feedback, interviewRounds, matchPercentage } = req.body;
  const app = await prisma.application.update({
    where: { id: existing.id },
    data: {
      ...(status && { status: status as AppStatus }),
      ...(notes !== undefined && { notes }),
      ...(feedback !== undefined && { feedback }),
      ...(interviewRounds !== undefined && { interviewRounds }),
      ...(matchPercentage !== undefined && { matchPercentage }),
    },
  });
  res.json({ application: app });
};

export const deleteApplication = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const id = String(req.params.id);
  const existing = await prisma.application.findFirst({
    where: { id, userId: req.user!.userId },
  });
  if (!existing) throw new AppError('Application not found', 404);
  await prisma.application.delete({ where: { id: existing.id } });
  res.json({ message: 'Application deleted' });
};
