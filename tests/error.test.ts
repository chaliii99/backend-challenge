import { normalizeError } from '@/middlewares/error';

describe('normalizeError', () => {
  it('maps MongoDB duplicate key errors to conflict responses', () => {
    const error = {
      code: 11000,
      keyPattern: { email: 1 },
      keyValue: { email: 'test@example.com' },
    };

    expect(normalizeError(error)).toEqual({
      statusCode: 409,
      message: 'email already exists',
      details: { email: 'test@example.com' },
    });
  });
});
