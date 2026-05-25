import { Router } from 'express';
import multer from 'multer';
import * as jobsController from '../controllers/jobsController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { allowedMimeTypes } from '../services/parser.service';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  },
});

const router = Router();

router.post('/match', optionalAuth, asyncHandler(jobsController.matchJobDescription));
router.post('/cover-letter', optionalAuth, asyncHandler(jobsController.generateCoverLetter));
router.post('/improve-bullet', optionalAuth, asyncHandler(jobsController.improveBullet));
router.post('/improve-resume', optionalAuth, asyncHandler(jobsController.improveFullResume));
router.post('/extract-text', upload.single('resume'), asyncHandler(jobsController.extractTextOnly));
router.post('/interview-questions', optionalAuth, asyncHandler(jobsController.generateInterviewQuestions));

router.post('/chat', optionalAuth, asyncHandler(jobsController.chatWithAssistant));
router.post('/chat/sessions', authenticate, asyncHandler(jobsController.createChatSession));
router.get('/chat/sessions', authenticate, asyncHandler(jobsController.listChatSessions));

export default router;
