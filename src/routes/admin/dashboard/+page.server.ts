import { redirect, fail } from '@sveltejs/kit';
import { db, threads, posts, bannedIps } from '$lib/db';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const session = cookies.get('admin_session');
	if (session !== 'authenticated') {
		redirect(302, '/admin');
	}

	const threadList = await db
		.select()
		.from(threads)
		.orderBy(desc(threads.updatedAt))
		.all();

	const bannedList = await db
		.select()
		.from(bannedIps)
		.orderBy(desc(bannedIps.createdAt))
		.all();

	return {
		threads: threadList.map((t) => ({
			...t,
			createdAt: t.createdAt.toISOString(),
			updatedAt: t.updatedAt.toISOString()
		})),
		bannedIps: bannedList.map((b) => ({
			...b,
			createdAt: b.createdAt.toISOString(),
			expiresAt: b.expiresAt?.toISOString() || null
		}))
	};
};

export const actions: Actions = {
	// ログアウト
	logout: async ({ cookies }) => {
		cookies.delete('admin_session', { path: '/' });
		redirect(302, '/admin');
	},

	// 新規スレッド作成
	createThread: async ({ request }) => {
		const formData = await request.formData();
		const threadNumber = parseInt(formData.get('threadNumber')?.toString() || '1');
		const title = formData.get('title')?.toString() || '';
		const body = formData.get('body')?.toString() || '';

		if (!title.trim()) {
			return fail(400, { error: 'タイトルを入力してください' });
		}

		const now = new Date();

		// スレッド作成
		const result = await db
			.insert(threads)
			.values({
				threadNumber,
				title,
				createdAt: now,
				updatedAt: now,
				postCount: body.trim() ? 1 : 0,
				isArchived: false
			})
			.returning();

		const newThread = result[0];

		// 本文がある場合は最初のレスを作成
		if (body.trim()) {
			await db.insert(posts).values({
				threadId: newThread.id,
				postNumber: 1,
				name: '管理人★',
				trip: null,
				email: '',
				body,
				ipAddress: '127.0.0.1',
				userId: 'ADMIN',
				createdAt: now,
				isDeleted: false,
				isAdmin: true
			});
		}

		return { success: true, message: 'スレッドを作成しました' };
	},

	// スレッド削除
	deleteThread: async ({ request }) => {
		const formData = await request.formData();
		const threadId = parseInt(formData.get('threadId')?.toString() || '0');

		if (!threadId) {
			return fail(400, { error: 'スレッドIDが不正です' });
		}

		// 関連する投稿を削除
		await db.delete(posts).where(eq(posts.threadId, threadId));
		// スレッドを削除
		await db.delete(threads).where(eq(threads.id, threadId));

		return { success: true, message: 'スレッドを削除しました' };
	},

	// レス削除
	deletePost: async ({ request }) => {
		const formData = await request.formData();
		const postId = parseInt(formData.get('postId')?.toString() || '0');

		if (!postId) {
			return fail(400, { error: '投稿IDが不正です' });
		}

		// 論理削除
		await db
			.update(posts)
			.set({ isDeleted: true })
			.where(eq(posts.id, postId));

		return { success: true, message: 'レスを削除しました' };
	},

	// IP規制追加
	banIp: async ({ request }) => {
		const formData = await request.formData();
		const ipAddress = formData.get('ipAddress')?.toString() || '';
		const reason = formData.get('reason')?.toString() || '';
		const duration = parseInt(formData.get('duration')?.toString() || '0');

		if (!ipAddress.trim()) {
			return fail(400, { error: 'IPアドレスを入力してください' });
		}

		const now = new Date();
		let expiresAt: Date | null = null;

		if (duration > 0) {
			expiresAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
		}

		try {
			await db.insert(bannedIps).values({
				ipAddress,
				reason,
				createdAt: now,
				expiresAt
			});
		} catch {
			return fail(400, { error: 'このIPは既に規制されています' });
		}

		return { success: true, message: 'IP規制を追加しました' };
	},

	// IP規制解除
	unbanIp: async ({ request }) => {
		const formData = await request.formData();
		const banId = parseInt(formData.get('banId')?.toString() || '0');

		if (!banId) {
			return fail(400, { error: '規制IDが不正です' });
		}

		await db.delete(bannedIps).where(eq(bannedIps.id, banId));

		return { success: true, message: 'IP規制を解除しました' };
	}
};
