import { Db, MongoClient } from 'mongodb';
import { env } from '@/config/env';

let client: MongoClient | undefined;
let db: Db | undefined;

export async function connectDatabase() {
  if (db) {
    return db;
  }

  client = new MongoClient(env.mongoUri);
  await client.connect();
  db = client.db(env.mongoDbName);

  await db.collection('users').createIndex({ email: 1 }, { unique: true });

  return db;
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database is not connected');
  }

  return db;
}

export async function closeDatabase() {
  if (client) {
    await client.close();
  }

  client = undefined;
  db = undefined;
}
