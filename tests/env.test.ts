describe('env config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('rejects the default JWT secret in production', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;

    await expect(import('@/config/env')).rejects.toThrow(
      'JWT_SECRET must be set to a secure value in production'
    );
  });

  it('allows an explicit JWT secret in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a-secure-secret-for-production';

    const { env } = await import('@/config/env');

    expect(env.jwtSecret).toBe('a-secure-secret-for-production');
  });
});
