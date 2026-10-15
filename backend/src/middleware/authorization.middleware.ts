import { NextFunction, Response } from 'express';
import { AuthRequest } from './auth.middleware';

/** Role checks must follow authenticateToken; unknown/missing roles fail closed. */
export function requireRoles(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || typeof req.user.role !== 'string') {
      return res.status(401).json({ message: 'Yêu cầu xác thực.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này.' });
    }

    return next();
  };
}
