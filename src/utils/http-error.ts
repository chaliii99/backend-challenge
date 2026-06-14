export class HttpError extends Error {
  statusCode: number;
  details?: unknown;
  code?: number;
  keyPattern?: Record<string, unknown>;
  keyValue?: Record<string, unknown>;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function createHttpError(message: string, statusCode: number, details?: unknown) {
  return new HttpError(message, statusCode, details);
}
