import { createApp } from '@/app';
import { closeDatabase, connectDatabase } from '@/config/database';
import { env } from '@/config/env';
import { startUserCountJob } from '@/jobs/user-count';

async function bootstrap() {
  await connectDatabase();

  const app = createApp();
  const stopUserCountJob = startUserCountJob();

  const server = app.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
  });

  async function shutdown(signal: NodeJS.Signals) {
    console.log(`${signal} received. Shutting down...`);
    stopUserCountJob();

    server.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
