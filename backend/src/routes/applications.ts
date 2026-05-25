import { Router } from 'express';
import * as appController from '../controllers/applicationController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(appController.listApplications));
router.post('/', asyncHandler(appController.createApplication));
router.patch('/:id', asyncHandler(appController.updateApplication));
router.delete('/:id', asyncHandler(appController.deleteApplication));

export default router;
