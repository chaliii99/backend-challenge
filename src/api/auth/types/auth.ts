import { z } from 'zod';
import { loginSchema, registerSchema } from '@/api/auth/validators/auth';

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
