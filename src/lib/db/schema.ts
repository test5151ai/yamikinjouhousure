import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// スレッドテーブル
export const threads = sqliteTable('threads', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	threadNumber: integer('thread_number').notNull(),
	title: text('title').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
	postCount: integer('post_count').notNull().default(0),
	isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false)
});

// 投稿テーブル
export const posts = sqliteTable('posts', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	threadId: integer('thread_id')
		.notNull()
		.references(() => threads.id),
	postNumber: integer('post_number').notNull(),
	name: text('name').notNull().default('名無しさん＠お腹いっぱい。'),
	trip: text('trip'),
	email: text('email'),
	body: text('body').notNull(),
	ipAddress: text('ip_address').notNull(),
	userId: text('user_id').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),
	isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false)
});

// 規制IPテーブル
export const bannedIps = sqliteTable('banned_ips', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	ipAddress: text('ip_address').notNull().unique(),
	reason: text('reason'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' })
});

// 型エクスポート
export type Thread = typeof threads.$inferSelect;
export type NewThread = typeof threads.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type BannedIp = typeof bannedIps.$inferSelect;
export type NewBannedIp = typeof bannedIps.$inferInsert;
