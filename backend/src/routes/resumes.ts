import { Router } from 'express';
import multer from 'multer';
import * as resumeController from '../controllers/resumeController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { allowedMimeTypes } from '../services/parser.service';
import { env } from '../config/env';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxFileSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  },
});

const router = Router();

router.use(authenticate);

router.get('/dashboard', asyncHandler(resumeController.getDashboardStats));
router.get('/', asyncHandler(resumeController.listResumes));
router.get('/:id', asyncHandler(resumeController.getResume));
router.post('/:id/latex', asyncHandler(resumeController.generateResumeLatex));
router.post('/', upload.single('resume'), asyncHandler(resumeController.uploadResume));
router.delete('/:id', asyncHandler(resumeController.deleteResume));

export default router;
