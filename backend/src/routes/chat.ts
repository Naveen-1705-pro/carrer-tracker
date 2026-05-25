import { Router } from 'express';
import { chatWithAssistant } from '../controllers/chatController';

const router = Router();

router.post('/', chatWithAssistant);

export default router;
