import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const dbPath = process.env.DATABASE_PATH || './data/sqlite.db';
const sqlite = new Database(dbPath);

// WALモードを有効にしてパフォーマンス向上
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

export * from './schema';
