import { Router } from 'express';
import multer from 'multer';
import { uploadResume } from '../controllers/uploadController';
import { allowedMimeTypes } from '../services/parser.service';

const router = Router();

// Store file in memory so we can parse it directly
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  }
});

router.post('/', upload.single('resume'), uploadResume);

export default router;
