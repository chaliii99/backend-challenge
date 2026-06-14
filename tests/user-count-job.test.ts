import cron from 'node-cron';
import { startUserCountJob, USER_COUNT_CRON_EXPRESSION } from '@/jobs/user-count';

jest.mock('node-cron', () => ({
  __esModule: true,
  default: {
    schedule: jest.fn(),
  },
}));

jest.mock('@/api/user/repositories/user', () => ({
  createUserRepository: jest.fn(() => ({
    count: jest.fn(),
  })),
}));

describe('startUserCountJob', () => {
  it('schedules the user count job every 10 seconds and stops the cron task', () => {
    const stop = jest.fn();
    jest
      .mocked(cron.schedule)
      .mockReturnValue({ stop } as unknown as ReturnType<typeof cron.schedule>);

    const stopJob = startUserCountJob();

    expect(cron.schedule).toHaveBeenCalledWith(USER_COUNT_CRON_EXPRESSION, expect.any(Function));

    stopJob();

    expect(stop).toHaveBeenCalledTimes(1);
  });
});
