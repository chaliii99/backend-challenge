import { ObjectId, type Collection, type Filter } from 'mongodb';
import { getDatabase } from '@/config/database';
import type {
  CreateUserInput,
  ListUsersQuery,
  PublicUser,
  UpdateUserInput,
  UserDocument,
  UserRepository,
} from '@/api/user/types/user';

export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id?.toHexString() || '',
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function usersCollection(): Collection<UserDocument> {
  return getDatabase().collection<UserDocument>('users');
}

export function createUserRepository(): UserRepository {
  return {
    async create(data: CreateUserInput): Promise<PublicUser> {
      const now = new Date();
      const user: UserDocument = {
        ...data,
        createdAt: now,
        updatedAt: now,
      };

      const result = await usersCollection().insertOne(user);
      return toPublicUser({ ...user, _id: result.insertedId });
    },

    async findByEmail(email: string): Promise<UserDocument | null> {
      return usersCollection().findOne({ email });
    },

    async findById(id: string): Promise<PublicUser | null> {
      if (!ObjectId.isValid(id)) {
        return null;
      }

      const user = await usersCollection().findOne({ _id: new ObjectId(id) });
      return user ? toPublicUser(user) : null;
    },

    async list(query: ListUsersQuery = {}) {
      const page = query.page || 1;
      const limit = query.limit || 20;
      const skip = (page - 1) * limit;
      const filter: Filter<UserDocument> = {};

      const [items, total] = await Promise.all([
        usersCollection().find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
        usersCollection().countDocuments(filter),
      ]);

      return {
        data: items.map(toPublicUser),
        meta: {
          page,
          limit,
          total,
        },
      };
    },

    async update(id: string, data: UpdateUserInput): Promise<PublicUser | null> {
      if (!ObjectId.isValid(id)) {
        return null;
      }

      const result = await usersCollection().findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...data, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      return result ? toPublicUser(result) : null;
    },

    async delete(id: string): Promise<boolean> {
      if (!ObjectId.isValid(id)) {
        return false;
      }

      const result = await usersCollection().deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount === 1;
    },

    count(): Promise<number> {
      return usersCollection().countDocuments();
    },
  };
}
