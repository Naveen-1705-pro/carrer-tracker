import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import resumesRouter from './routes/resumes';
import jobsRouter from './routes/jobs';
import applicationsRouter from './routes/applications';
import adminRouter from './routes/admin';
import uploadRouter from './routes/upload';
import { errorHandler } from './middleware/errorHandler';
import { env } from './config/env';

dotenv.config();

const app: Express = express();

app.use(helmet());
app.use(
  cors({
    origin: [env.frontendUrl, 'http://localhost:3000'],
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'AI rate limit exceeded. Please wait a moment.' },
});
app.use('/api/jobs', aiLimiter);
app.use('/api/resumes', aiLimiter);

app.use('/api/auth', authRouter);
app.use('/api/resumes', resumesRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/admin', adminRouter);

// Legacy upload path → upload controller (unauthenticated)
app.use('/api/upload', uploadRouter);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'AI ResumeIQ API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`⚡️ AI ResumeIQ API running at http://localhost:${env.port}`);
});
