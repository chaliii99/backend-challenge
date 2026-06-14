import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '@/utils/jwt';
import { createHttpError } from '@/utils/http-error';

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(createHttpError('Missing authorization token', 401));
  }

  try {
    const token = header.slice('Bearer '.length);
    req.user = verifyToken(token);
    return next();
  } catch (_error) {
    return next(createHttpError('Invalid authorization token', 401));
  }
}
