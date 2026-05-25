import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '8000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  geminiApiKey: process.env.GEMINI_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),
  uploadDir: process.env.UPLOAD_DIR || './uploads',
};

export const hasAiKey = (): boolean =>
  Boolean(
    env.geminiApiKey &&
      env.geminiApiKey !== 'your_openai_api_key' &&
      env.geminiApiKey.length > 10
  ) ||
  Boolean(env.openaiApiKey && env.openaiApiKey.startsWith('sk-'));
