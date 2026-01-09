import { db } from '$lib/db';
import { threads, posts, bannedIps } from '$lib/db/schema';
import { sql } from 'drizzle-orm';

// アプリ起動時にテーブル作成
async function initDatabase() {
	try {
		// threadsテーブル作成
		db.run(sql`
			CREATE TABLE IF NOT EXISTS threads (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				thread_number INTEGER NOT NULL,
				title TEXT NOT NULL,
				created_at INTEGER NOT NULL,
				updated_at INTEGER NOT NULL,
				post_count INTEGER NOT NULL DEFAULT 0,
				is_archived INTEGER NOT NULL DEFAULT 0
			)
		`);

		// postsテーブル作成
		db.run(sql`
			CREATE TABLE IF NOT EXISTS posts (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				thread_id INTEGER NOT NULL REFERENCES threads(id),
				post_number INTEGER NOT NULL,
				name TEXT NOT NULL DEFAULT '名無しさん＠お腹いっぱい。',
				trip TEXT,
				email TEXT,
				body TEXT NOT NULL,
				ip_address TEXT NOT NULL,
				user_id TEXT NOT NULL,
				created_at INTEGER NOT NULL,
				is_deleted INTEGER NOT NULL DEFAULT 0,
				is_admin INTEGER NOT NULL DEFAULT 0
			)
		`);

		// banned_ipsテーブル作成
		db.run(sql`
			CREATE TABLE IF NOT EXISTS banned_ips (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				ip_address TEXT NOT NULL UNIQUE,
				reason TEXT,
				created_at INTEGER NOT NULL,
				expires_at INTEGER
			)
		`);

		// インデックス作成
		db.run(sql`CREATE INDEX IF NOT EXISTS idx_posts_thread_id ON posts(thread_id)`);
		db.run(sql`CREATE INDEX IF NOT EXISTS idx_threads_updated_at ON threads(updated_at)`);

		console.log('Database initialized');
	} catch (error) {
		console.error('Database initialization error:', error);
	}
}

// 初期化実行
initDatabase();

export const handle = async ({ event, resolve }) => {
	return resolve(event);
};
