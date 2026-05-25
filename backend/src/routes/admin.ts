import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/stats', asyncHandler(adminController.getPlatformStats));
router.get('/users', asyncHandler(adminController.listUsers));
router.patch('/users/:id/role', asyncHandler(adminController.updateUserRole));

export default router;
