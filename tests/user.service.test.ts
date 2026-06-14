import { createUserService } from '@/api/user/services/user';
import type { PublicUser, UserDocument, UserRepository } from '@/api/user/types/user';
import { hashPassword } from '@/utils/password';

jest.mock('@/utils/password', () => ({
  hashPassword: jest.fn(),
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

describe('createUserService', () => {
  const publicUser: PublicUser = {
    id: 'user-id',
    name: 'Alice',
    email: 'alice@example.com',
    createdAt: new Date('2026-06-14T00:00:00.000Z'),
    updatedAt: new Date('2026-06-14T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('hashes the password before creating a user', async () => {
    const userRepository = createMockUserRepository();
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockResolvedValue(publicUser);
    jest.mocked(hashPassword).mockResolvedValue('hashed-password' as never);

    const service = createUserService(userRepository);

    const result = await service.createUser({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    });

    expect(hashPassword).toHaveBeenCalledWith('password123');
    expect(userRepository.create).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'hashed-password',
    });
    expect(result).toBe(publicUser);
  });

  it('rejects duplicate email when creating a user', async () => {
    const userRepository = createMockUserRepository();
    userRepository.findByEmail.mockResolvedValue({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'hashed-password',
      createdAt: new Date('2026-06-14T00:00:00.000Z'),
    } as UserDocument);

    const service = createUserService(userRepository);

    await expect(
      service.createUser({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
      })
    ).rejects.toMatchObject({
      message: 'Email already exists',
      statusCode: 409,
    });

    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('rejects missing user when fetching by ID', async () => {
    const userRepository = createMockUserRepository();
    userRepository.findById.mockResolvedValue(null);

    const service = createUserService(userRepository);

    await expect(service.getUser('missing-id')).rejects.toMatchObject({
      message: 'User not found',
      statusCode: 404,
    });
  });

  it('rejects missing user when updating by ID', async () => {
    const userRepository = createMockUserRepository();
    userRepository.update.mockResolvedValue(null);

    const service = createUserService(userRepository);

    await expect(service.updateUser('missing-id', { name: 'Updated' })).rejects.toMatchObject({
      message: 'User not found',
      statusCode: 404,
    });
  });

  it('rejects missing user when deleting by ID', async () => {
    const userRepository = createMockUserRepository();
    userRepository.delete.mockResolvedValue(false);

    const service = createUserService(userRepository);

    await expect(service.deleteUser('missing-id')).rejects.toMatchObject({
      message: 'User not found',
      statusCode: 404,
    });
  });
});
