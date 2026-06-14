import type { NextFunction, Request, Response } from 'express';
import { validate } from '@/utils/validate';
import { createAuthService } from '@/api/auth/services/auth';
import { loginSchema, registerSchema } from '@/api/auth/validators/auth';

const authService = createAuthService();

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const body = validate(registerSchema, req.body);
    const result = await authService.register(body);
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const body = validate(loginSchema, req.body);
    const result = await authService.login(body);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}
