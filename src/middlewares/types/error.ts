import type { HttpError } from '@/utils/http-error';

export type NormalizedError = {
  statusCode: number;
  message: string;
  details?: unknown;
};

export type ErrorLike = Partial<HttpError> & {
  message?: string;
};
