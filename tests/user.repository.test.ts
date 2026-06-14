import { ObjectId } from 'mongodb';
import { createUserRepository } from '@/api/user/repositories/user';
import { getDatabase } from '@/config/database';

jest.mock('@/config/database', () => ({
  getDatabase: jest.fn(),
}));

function mockUsersCollection(collection: Record<string, unknown>) {
  jest.mocked(getDatabase).mockReturnValue({
    collection: jest.fn(() => collection),
  } as never);
}

describe('createUserRepository', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates a user using the MongoDB users collection', async () => {
    const insertedId = new ObjectId();
    const insertOne = jest.fn().mockResolvedValue({ insertedId });
    mockUsersCollection({ insertOne });

    const repository = createUserRepository();

    const result = await repository.create({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'hashed-password',
    });

    expect(insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'hashed-password',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
    );
    expect(result).toMatchObject({
      id: insertedId.toHexString(),
      name: 'Alice',
      email: 'alice@example.com',
    });
  });

  it('returns null without querying MongoDB when findById receives an invalid ObjectId', async () => {
    const findOne = jest.fn();
    mockUsersCollection({ findOne });

    const repository = createUserRepository();

    const result = await repository.findById('invalid-id');

    expect(result).toBeNull();
    expect(findOne).not.toHaveBeenCalled();
  });

  it('lists users using MongoDB pagination methods', async () => {
    const userId = new ObjectId();
    const toArray = jest.fn().mockResolvedValue([
      {
        _id: userId,
        name: 'Alice',
        email: 'alice@example.com',
        password: 'hashed-password',
        createdAt: new Date('2026-06-14T00:00:00.000Z'),
      },
    ]);
    const limit = jest.fn(() => ({ toArray }));
    const skip = jest.fn(() => ({ limit }));
    const sort = jest.fn(() => ({ skip }));
    const find = jest.fn(() => ({ sort }));
    const countDocuments = jest.fn().mockResolvedValue(1);
    mockUsersCollection({ find, countDocuments });

    const repository = createUserRepository();

    const result = await repository.list({ page: 2, limit: 10 });

    expect(find).toHaveBeenCalledWith({});
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(skip).toHaveBeenCalledWith(10);
    expect(limit).toHaveBeenCalledWith(10);
    expect(countDocuments).toHaveBeenCalledWith({});
    expect(result).toEqual({
      data: [
        {
          id: userId.toHexString(),
          name: 'Alice',
          email: 'alice@example.com',
          createdAt: new Date('2026-06-14T00:00:00.000Z'),
          updatedAt: undefined,
        },
      ],
      meta: {
        page: 2,
        limit: 10,
        total: 1,
      },
    });
  });
});
