import type { NextFunction, Request, Response } from 'express';
import { authMiddleware } from '@/middlewares/auth';
import { verifyToken } from '@/utils/jwt';

jest.mock('@/utils/jwt', () => ({
  verifyToken: jest.fn(),
}));

function createRequest(authorization?: string): Request {
  return {
    headers: {
      authorization,
    },
  } as Request;
}

describe('authMiddleware', () => {
  const response = {} as Response;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('rejects requests without a bearer token', () => {
    const request = createRequest();
    const next = jest.fn() as NextFunction;

    authMiddleware(request, response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Missing authorization token',
        statusCode: 401,
      })
    );
  });

  it('rejects invalid tokens', () => {
    const request = createRequest('Bearer invalid-token');
    const next = jest.fn() as NextFunction;
    jest.mocked(verifyToken).mockImplementation(() => {
      throw new Error('invalid token');
    });

    authMiddleware(request, response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Invalid authorization token',
        statusCode: 401,
      })
    );
  });

  it('sets req.user and continues when token is valid', () => {
    const request = createRequest('Bearer valid-token');
    const next = jest.fn() as NextFunction;
    jest.mocked(verifyToken).mockReturnValue({
      sub: 'user-id',
      email: 'alice@example.com',
    });

    authMiddleware(request, response, next);

    expect(verifyToken).toHaveBeenCalledWith('valid-token');
    expect(request.user).toEqual({
      sub: 'user-id',
      email: 'alice@example.com',
    });
    expect(next).toHaveBeenCalledWith();
  });
});
