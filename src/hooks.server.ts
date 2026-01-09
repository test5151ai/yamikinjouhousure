import { db } from '$lib/db';
import { threads, posts, bannedIps, admins } from '$lib/db/schema';
import { sql, eq } from 'drizzle-orm';
import { createHash } from 'crypto';

// パスワードのハッシュ化
function hashPassword(password: string): string {
	return createHash('sha256').update(password).digest('hex');
}

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

		// adminsテーブル作成
		db.run(sql`
			CREATE TABLE IF NOT EXISTS admins (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				username TEXT NOT NULL UNIQUE,
				password TEXT NOT NULL,
				role TEXT NOT NULL DEFAULT 'admin',
				created_at INTEGER NOT NULL,
				created_by INTEGER
			)
		`);

		// インデックス作成
		db.run(sql`CREATE INDEX IF NOT EXISTS idx_posts_thread_id ON posts(thread_id)`);
		db.run(sql`CREATE INDEX IF NOT EXISTS idx_threads_updated_at ON threads(updated_at)`);

		// 最高管理者が存在しない場合は作成、存在する場合はユーザー名を更新
		const superadmin = db.select().from(admins).where(eq(admins.role, 'superadmin')).get();
		if (!superadmin) {
			const superadminPassword = process.env.ADMIN_PASSWORD || '5151test';
			db.insert(admins).values({
				username: 'test5151',
				password: hashPassword(superadminPassword),
				role: 'superadmin',
				createdAt: new Date()
			}).run();
			console.log('Superadmin created');
		} else if (superadmin.username !== 'test5151') {
			// ユーザー名を更新
			db.update(admins)
				.set({ username: 'test5151' })
				.where(eq(admins.role, 'superadmin'))
				.run();
			console.log('Superadmin username updated to test5151');
		}

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
