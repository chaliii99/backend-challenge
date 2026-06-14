import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import authRoutes from '@/api/auth/routes/auth';
import userRoutes from '@/api/user/routes/user';
import { openApiSpec } from '@/docs/openapi';
import { errorMiddleware } from '@/middlewares/error';
import { loggingMiddleware } from '@/middlewares/logging';
import { createHttpError } from '@/utils/http-error';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(loggingMiddleware);

  app.get('/api-docs.json', (_req, res) => {
    res.json(openApiSpec);
  });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);

  app.use((_req, _res, next) => {
    next(createHttpError('Route not found', 404));
  });

  app.use(errorMiddleware);
  return app;
}
