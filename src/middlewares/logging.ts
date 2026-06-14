import type { NextFunction, Request, Response } from 'express';

export function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(2)}ms`);
  });

  next();
}
