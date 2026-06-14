import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_JWT_SECRET = 'change-me';

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  mongoDbName: process.env.MONGODB_DB_NAME || 'backend_challenge',
  jwtSecret: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
};

if (env.nodeEnv === 'production' && env.jwtSecret === DEFAULT_JWT_SECRET) {
  throw new Error('JWT_SECRET must be set to a secure value in production');
}
