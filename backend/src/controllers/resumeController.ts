import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { extractResumeText } from '../services/parser.service';
import { parseResumeWithAI, generateResumeLatexAI } from '../services/ai.service';
import { computeAtsScore, mergeAtsScores } from '../services/ats.service';
import { storeResumeEmbedding } from '../services/embedding.service';
import { env } from '../config/env';

export const uploadResume = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) throw new AppError('No file uploaded');
  if (!req.user) throw new AppError('Authentication required', 401);

  const { targetRole } = req.body;

  const text = await extractResumeText(req.file.buffer, req.file.mimetype);
  if (!text) throw new AppError('Could not extract text from file');

  const ruleAts = computeAtsScore(text);
  const aiParsed = await parseResumeWithAI(text, targetRole, req.user.userId);
  const aiScore = typeof aiParsed.atsScore === 'number' ? aiParsed.atsScore : undefined;
  const { score, details } = mergeAtsScores(ruleAts, aiScore);

  const mergedData = {
    ...aiParsed,
    atsScore: score,
    atsDetails: { ...details, ...(aiParsed.atsDetails as object) },
    ruleBasedAts: details,
  };

  if (!fs.existsSync(env.uploadDir)) fs.mkdirSync(env.uploadDir, { recursive: true });
  const filePath = path.join(env.uploadDir, `${Date.now()}-${req.file.originalname}`);
  fs.writeFileSync(filePath, req.file.buffer);

  const resume = await prisma.resume.create({
    data: {
      userId: req.user.userId,
      title: req.file.originalname,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      originalFileUrl: filePath,
      rawText: text,
      extractedData: JSON.parse(JSON.stringify(mergedData)) as Prisma.InputJsonValue,
      atsScore: score,
      atsDetails: JSON.parse(JSON.stringify(mergedData.atsDetails)) as Prisma.InputJsonValue,
    },
  });

  await storeResumeEmbedding(resume.id, text);
  await prisma.processingLog.create({
    data: {
      userId: req.user.userId,
      action: 'RESUME_UPLOAD',
      status: 'SUCCESS',
      metadata: { resumeId: resume.id, atsScore: score },
    },
  });

  res.status(201).json({
    message: 'Resume parsed successfully',
    resume: {
      id: resume.id,
      title: resume.title,
      atsScore: score,
      data: mergedData,
    },
  });
};

export const listResumes = async (req: AuthRequest, res: Response): Promise<void> => {
  const resumes = await prisma.resume.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      atsScore: true,
      fileName: true,
      createdAt: true,
      extractedData: true,
    },
  });
  res.json({ resumes });
};

export const getResume = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const resume = await prisma.resume.findFirst({
    where: { id, userId: req.user!.userId },
  });
  if (!resume) throw new AppError('Resume not found', 404);
  res.json({ resume });
};

export const deleteResume = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const resume = await prisma.resume.findFirst({
    where: { id, userId: req.user!.userId },
  });
  if (!resume) throw new AppError('Resume not found', 404);
  await prisma.resume.delete({ where: { id: resume.id } });
  res.json({ message: 'Resume deleted' });
};

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const [resumes, applications, latestResume] = await Promise.all([
    prisma.resume.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.application.findMany({ where: { userId } }),
    prisma.resume.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
  ]);

  const skills = new Set<string>();
  resumes.forEach((r) => {
    const data = r.extractedData as { skills?: string[] } | null;
    data?.skills?.forEach((s) => skills.add(s));
  });

  const data = latestResume?.extractedData as Record<string, unknown> | null;

  res.json({
    atsScore: latestResume?.atsScore ?? 0,
    resumeStrength: latestResume?.atsScore ?? 0,
    applicationsCount: applications.length,
    skillsDetected: Array.from(skills).slice(0, 20),
    missingSkills: (data?.missingSkills as string[]) || [],
    interviewProbability: (data?.interviewProbability as number) ?? 0,
    industryMatch: (data?.industryMatch as number) ?? 0,
    recentResumes: resumes,
    applicationsByStatus: {
      APPLIED: applications.filter((a) => a.status === 'APPLIED').length,
      INTERVIEW: applications.filter((a) => a.status === 'INTERVIEW').length,
      OFFER: applications.filter((a) => a.status === 'OFFER').length,
      REJECTED: applications.filter((a) => a.status === 'REJECTED').length,
    },
  });
};

export const generateResumeLatex = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const { regenerate } = req.body;

  const resume = await prisma.resume.findFirst({
    where: { id, userId: req.user!.userId },
  });

  if (!resume) throw new AppError('Resume not found', 404);

  let latexCode = '';
  const extData = resume.extractedData as Record<string, any> | null;

  if (extData && extData.latexCode && !regenerate) {
    latexCode = extData.latexCode;
  } else {
    if (!resume.rawText) throw new AppError('Resume raw text is empty. Cannot generate LaTeX.', 400);
    latexCode = await generateResumeLatexAI(resume.rawText, req.user!.userId);

    const updatedExtractedData = {
      ...(extData || {}),
      latexCode,
    };

    await prisma.resume.update({
      where: { id: resume.id },
      data: {
        extractedData: JSON.parse(JSON.stringify(updatedExtractedData)) as Prisma.InputJsonValue,
      },
    });

    await prisma.processingLog.create({
      data: {
        userId: req.user!.userId,
        action: 'RESUME_LATEX_GENERATE',
        status: 'SUCCESS',
        metadata: { resumeId: resume.id },
      },
    });
  }

  res.json({ latexCode });
};

