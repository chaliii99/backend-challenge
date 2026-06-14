import cron from "node-cron";
import dayjs from "dayjs";
import { createUserRepository } from '@/api/user/repositories/user';

export const USER_COUNT_CRON_EXPRESSION = "*/10 * * * * *";

export function startUserCountJob() {
  const userRepository = createUserRepository();

  const task = cron.schedule(USER_COUNT_CRON_EXPRESSION, async () => {
    try {
      const total = await userRepository.count();
      const now = dayjs().format("YYYY-MM-DD HH:mm:ss")

      console.log(`Date Now :: ${now} :: Total users :: ${total}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Failed to count users:", message);
    }
  });

  return () => task.stop();
}
