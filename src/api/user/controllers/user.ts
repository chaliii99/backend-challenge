import type { NextFunction, Request, Response } from 'express';
import { validate } from '@/utils/validate';
import { createUserService } from '@/api/user/services/user';
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
} from '@/api/user/validators/user';
import type { UserIdParams } from '@/api/user/types/user';

const userService = createUserService();

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const body = validate(createUserSchema, req.body);
    const user = await userService.createUser(body);
    res.status(201).json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function getUser(req: Request<UserIdParams>, res: Response, next: NextFunction) {
  try {
    const user = await userService.getUser(req.params.id);
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const query = validate(listUsersQuerySchema, req.query);
    const result = await userService.listUsers(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request<UserIdParams>, res: Response, next: NextFunction) {
  try {
    const body = validate(updateUserSchema, req.body);
    const user = await userService.updateUser(req.params.id, body);
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: Request<UserIdParams>, res: Response, next: NextFunction) {
  try {
    await userService.deleteUser(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
