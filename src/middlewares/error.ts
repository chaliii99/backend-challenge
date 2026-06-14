import type { ErrorRequestHandler } from 'express';
import type { ErrorLike, NormalizedError } from '@/middlewares/types/error';

export function normalizeError(error: ErrorLike): NormalizedError {
  if (error.code === 11000) {
    const duplicatedFields = Object.keys(error.keyPattern || error.keyValue || {});
    const fieldLabel = duplicatedFields.length > 0 ? duplicatedFields.join(', ') : 'field';

    return {
      statusCode: 409,
      message: `${fieldLabel} already exists`,
      details: error.keyValue,
    };
  }

  return {
    statusCode: error.statusCode || 500,
    message: error.message || 'Internal server error',
    details: error.details,
  };
}

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  const normalizedError = normalizeError(error);
  const statusCode = normalizedError.statusCode;
  const response: { error: { message: string; details?: unknown } } = {
    error: {
      message: statusCode === 500 ? 'Internal server error' : normalizedError.message,
    },
  };

  if (statusCode < 500 && normalizedError.details) {
    response.error.details = normalizedError.details;
  }

  res.status(statusCode).json(response);
};
