import { createUserRepository } from '@/api/user/repositories/user';
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
  UserRepository,
} from '@/api/user/types/user';
import { createHttpError } from '@/utils/http-error';
import { hashPassword } from '@/utils/password';

export function createUserService(userRepository: UserRepository = createUserRepository()) {
  return {
    async createUser(data: CreateUserInput) {
      const existingUser = await userRepository.findByEmail(data.email);

      if (existingUser) {
        throw createHttpError('Email already exists', 409);
      }

      return userRepository.create({
        ...data,
        password: await hashPassword(data.password),
      });
    },

    async getUser(id: string) {
      const user = await userRepository.findById(id);

      if (!user) {
        throw createHttpError('User not found', 404);
      }

      return user;
    },

    listUsers(query: ListUsersQuery) {
      return userRepository.list(query);
    },

    async updateUser(id: string, data: UpdateUserInput) {
      const user = await userRepository.update(id, data);

      if (!user) {
        throw createHttpError('User not found', 404);
      }

      return user;
    },

    async deleteUser(id: string) {
      const deleted = await userRepository.delete(id);

      if (!deleted) {
        throw createHttpError('User not found', 404);
      }
    },
  };
}
