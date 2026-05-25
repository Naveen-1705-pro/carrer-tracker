import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { extractResumeText } from '../services/parser.service';
import {
  matchJobWithAI,
  generateCoverLetterAI,
  improveBulletAI,
  careerChatAI,
  improveResumeAI,
} from '../services/ai.service';
import { semanticMatchScore } from '../services/embedding.service';

export const matchJobDescription = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { resumeText, jobDescription, resumeId } = req.body;
  if (!resumeText || !jobDescription) {
    throw new AppError('resumeText and jobDescription are required');
  }

  const [aiResult, semanticScore] = await Promise.all([
    matchJobWithAI(resumeText, jobDescription, req.user?.userId),
    semanticMatchScore(resumeText, jobDescription),
  ]);

  const matchPercentage = Math.round(
    ((aiResult.matchPercentage as number) || semanticScore) * 0.7 +
      semanticScore * 0.3
  );

  const data = { ...aiResult, matchPercentage, semanticScore } as Record<string, unknown>;

  if (resumeId && req.user) {
    await prisma.jobMatch.create({
      data: {
        resumeId,
        jobDescription,
        matchPercentage,
        missingSkills: data.missingSkills as Prisma.InputJsonValue,
        matchingKeywords: data.matchingKeywords as Prisma.InputJsonValue,
        recommendations: data.recommendations as Prisma.InputJsonValue,
      },
    });
  }

  res.json({ message: 'Match analysis complete', data });
};

export const generateCoverLetter = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { resumeText, jobDescription, companyName, jobTitle, tone, resumeId } =
    req.body;
  if (!resumeText || !jobDescription) {
    throw new AppError('resumeText and jobDescription are required');
  }

  const coverLetter = await generateCoverLetterAI(
    { resumeText, jobDescription, companyName, jobTitle, tone },
    req.user?.userId
  );

  if (req.user) {
    await prisma.coverLetter.create({
      data: {
        userId: req.user.userId,
        resumeId: resumeId || null,
        companyName,
        jobTitle,
        jobDescription,
        tone: tone || 'professional',
        content: coverLetter,
      },
    });
  }

  res.json({ message: 'Cover letter generated', coverLetter });
};

export const improveBullet = async (req: AuthRequest, res: Response): Promise<void> => {
  const { bullet, context } = req.body;
  if (!bullet) throw new AppError('bullet text is required');

  const improved = await improveBulletAI(bullet, context, req.user?.userId);
  res.json({ improved });
};

export const improveFullResume = async (req: AuthRequest, res: Response): Promise<void> => {
  const { resumeText, targetRole } = req.body;
  if (!resumeText) throw new AppError('resumeText is required');

  const data = await improveResumeAI(resumeText, targetRole, req.user?.userId);
  res.json({ data });
};

export const extractTextOnly = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) throw new AppError('No file uploaded');
  const text = await extractResumeText(req.file.buffer, req.file.mimetype);
  res.json({ text });
};

export const generateInterviewQuestions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { resumeText, jobDescription } = req.body;
  if (!jobDescription) throw new AppError('jobDescription is required');

  const mockQuestions = [
    'Tell me about a challenging project you led and its measurable outcome.',
    'How do you prioritize tasks when working with cross-functional teams?',
    'Describe a time you had to learn a new technology quickly for a deadline.',
    'What interests you about this role and our company?',
    'How do you handle feedback and iterate on your work?',
  ];

  res.json({
    questions: mockQuestions,
    tip: 'Practice STAR format (Situation, Task, Action, Result) for behavioral questions.',
  });
};

export const chatWithAssistant = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { messages, sessionId, resumeText } = req.body;
  if (!messages || !Array.isArray(messages)) {
    throw new AppError('Messages array is required');
  }

  const reply = await careerChatAI(messages, resumeText, req.user?.userId);

  if (req.user && sessionId) {
    const lastUser = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
    if (lastUser) {
      await prisma.chatMessage.createMany({
        data: [
          { sessionId, role: 'user', content: lastUser.content },
          { sessionId, role: 'assistant', content: reply },
        ],
      });
    }
  }

  res.json({ reply });
};

export const createChatSession = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { title } = req.body;
  const session = await prisma.chatSession.create({
    data: { userId: req.user!.userId, title: title || 'Career Chat' },
  });
  res.status(201).json({ session });
};

export const listChatSessions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const sessions = await prisma.chatSession.findMany({
    where: { userId: req.user!.userId },
    orderBy: { updatedAt: 'desc' },
    include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
  });
  res.json({ sessions });
};
