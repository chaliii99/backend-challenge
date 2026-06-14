import { createAuthService } from '@/api/auth/services/auth';
import type { UserDocument, UserRepository } from '@/api/user/types/user';
import { comparePassword, hashPassword } from '@/utils/password';
import { signToken } from '@/utils/jwt';
import { ObjectId } from 'mongodb';

jest.mock('@/utils/password', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

jest.mock('@/utils/jwt', () => ({
  signToken: jest.fn(),
}));

function createMockUserRepository(): jest.Mocked<UserRepository> {
  return {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };
}

describe('createAuthService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('registers a user and returns a token', async () => {
    const userRepository = createMockUserRepository();
    const createdAt = new Date('2026-06-14T00:00:00.000Z');
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockResolvedValue({
      id: 'user-id',
      name: 'Alice',
      email: 'alice@example.com',
      createdAt,
      updatedAt: createdAt,
    });
    jest.mocked(hashPassword).mockResolvedValue('hashed-password' as never);
    jest.mocked(signToken).mockReturnValue('jwt-token' as never);

    const service = createAuthService(userRepository);

    const result = await service.register({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    });

    expect(userRepository.create).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'hashed-password',
    });
    expect(signToken).toHaveBeenCalledWith({ sub: 'user-id', email: 'alice@example.com' });
    expect(result.token).toBe('jwt-token');
    expect(result.user.email).toBe('alice@example.com');
  });

  it('rejects duplicate email during registration', async () => {
    const userRepository = createMockUserRepository();
    userRepository.findByEmail.mockResolvedValue({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'hashed-password',
      createdAt: new Date('2026-06-14T00:00:00.000Z'),
    } as UserDocument);

    const service = createAuthService(userRepository);

    await expect(
      service.register({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
      })
    ).rejects.toMatchObject({
      message: 'Email already exists',
      statusCode: 409,
    });
  });

  it('logs in a user and returns a token', async () => {
    const userRepository = createMockUserRepository();
    const userId = new ObjectId();
    userRepository.findByEmail.mockResolvedValue({
      _id: userId,
      name: 'Alice',
      email: 'alice@example.com',
      password: 'hashed-password',
      createdAt: new Date('2026-06-14T00:00:00.000Z'),
    });
    jest.mocked(comparePassword).mockResolvedValue(true as never);
    jest.mocked(signToken).mockReturnValue('jwt-token' as never);

    const service = createAuthService(userRepository);

    const result = await service.login({
      email: 'alice@example.com',
      password: 'password123',
    });

    expect(comparePassword).toHaveBeenCalledWith('password123', 'hashed-password');
    expect(signToken).toHaveBeenCalledWith({
      sub: userId.toHexString(),
      email: 'alice@example.com',
    });
    expect(result.token).toBe('jwt-token');
    expect(result.user).not.toHaveProperty('password');
  });

  it('rejects invalid login credentials', async () => {
    const userRepository = createMockUserRepository();
    userRepository.findByEmail.mockResolvedValue(null);

    const service = createAuthService(userRepository);

    await expect(
      service.login({
        email: 'alice@example.com',
        password: 'wrong-password',
      })
    ).rejects.toMatchObject({
      message: 'Invalid email or password',
      statusCode: 401,
    });
  });
});
