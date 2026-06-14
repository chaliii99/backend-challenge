import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env';
import type { JwtPayload } from '@/types/jwt';

export function signToken(payload: JwtPayload) {
  const options: SignOptions = {
    algorithm: 'HS256',
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.jwtSecret, {
    algorithms: ['HS256'],
  }) as JwtPayload;
}
