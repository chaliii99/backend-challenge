import {
  createUserRepository,
  toPublicUser,
} from '@/api/user/repositories/user';
import type { UserRepository } from '@/api/user/types/user';
import type { LoginInput, RegisterInput } from '@/api/auth/types/auth';
import { createHttpError } from '@/utils/http-error';
import { comparePassword, hashPassword } from '@/utils/password';
import { signToken } from '@/utils/jwt';

export function createAuthService(userRepository: UserRepository = createUserRepository()) {
  return {
    async register(data: RegisterInput) {
      const existingUser = await userRepository.findByEmail(data.email);

      if (existingUser) {
        throw createHttpError('Email already exists', 409);
      }

      const user = await userRepository.create({
        name: data.name,
        email: data.email,
        password: await hashPassword(data.password),
      });

      const token = signToken({ sub: user.id, email: user.email });

      return { user, token };
    },

    async login(data: LoginInput) {
      const user = await userRepository.findByEmail(data.email);

      if (!user || !(await comparePassword(data.password, user.password))) {
        throw createHttpError('Invalid email or password', 401);
      }

      const publicUser = toPublicUser(user);
      const token = signToken({ sub: publicUser.id, email: publicUser.email });

      return { user: publicUser, token };
    },
  };
}
