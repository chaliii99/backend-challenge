import { z } from 'zod';
import { createHttpError } from '@/utils/http-error';

export function validate<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw createHttpError('Validation failed', 400, result.error.flatten());
  }

  return result.data;
}
