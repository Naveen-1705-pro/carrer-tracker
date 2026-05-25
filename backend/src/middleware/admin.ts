import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { Role } from '../types/db';

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== Role.ADMIN) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};
