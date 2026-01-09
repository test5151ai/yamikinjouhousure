import { redirect, fail } from '@sveltejs/kit';
import { db, threads, posts, bannedIps, admins } from '$lib/db';
import { eq, desc, ne } from 'drizzle-orm';
import { createHash } from 'crypto';
import type { PageServerLoad, Actions } from './$types';

function hashPassword(password: string): string {
	return createHash('sha256').update(password).digest('hex');
}

interface SessionData {
	authenticated: boolean;
	adminId: number;
	username: string;
	role: string;
}

function getSession(cookies: { get: (name: string) => string | undefined }): SessionData | null {
	const session = cookies.get('admin_session');
	if (!session) return null;
	try {
		const data = JSON.parse(session);
		if (data.authenticated) return data;
	} catch {
		// Invalid session
	}
	return null;
}

export const load: PageServerLoad = async ({ cookies }) => {
	const session = getSession(cookies);
	if (!session) {
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

	// 管理者一覧（最高管理者のみ表示）
	let adminList: { id: number; username: string; role: string; createdAt: string }[] = [];
	if (session.role === 'superadmin') {
		const adminsData = await db
			.select()
			.from(admins)
			.orderBy(desc(admins.createdAt))
			.all();
		adminList = adminsData.map((a) => ({
			id: a.id,
			username: a.username,
			role: a.role,
			createdAt: a.createdAt.toISOString()
		}));
	}

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
		})),
		admins: adminList,
		currentUser: {
			username: session.username,
			role: session.role
		}
	};
};

export const actions: Actions = {
	// ログアウト
	logout: async ({ cookies }) => {
		cookies.delete('admin_session', { path: '/' });
		redirect(302, '/admin');
	},

	// 管理者追加（最高管理者のみ）
	addAdmin: async ({ request, cookies }) => {
		const session = getSession(cookies);
		if (!session || session.role !== 'superadmin') {
			return fail(403, { error: '権限がありません' });
		}

		const formData = await request.formData();
		const username = formData.get('newUsername')?.toString() || '';
		const password = formData.get('newPassword')?.toString() || '';

		if (!username.trim() || !password.trim()) {
			return fail(400, { error: 'ユーザー名とパスワードを入力してください' });
		}

		if (username.length < 3) {
			return fail(400, { error: 'ユーザー名は3文字以上にしてください' });
		}

		if (password.length < 6) {
			return fail(400, { error: 'パスワードは6文字以上にしてください' });
		}

		// 既存のユーザーをチェック
		const existing = db.select().from(admins).where(eq(admins.username, username)).get();
		if (existing) {
			return fail(400, { error: 'このユーザー名は既に使用されています' });
		}

		await db.insert(admins).values({
			username,
			password: hashPassword(password),
			role: 'admin',
			createdAt: new Date(),
			createdBy: session.adminId
		});

		return { success: true, message: `管理者「${username}」を追加しました` };
	},

	// 管理者削除（最高管理者のみ）
	deleteAdmin: async ({ request, cookies }) => {
		const session = getSession(cookies);
		if (!session || session.role !== 'superadmin') {
			return fail(403, { error: '権限がありません' });
		}

		const formData = await request.formData();
		const adminId = parseInt(formData.get('adminId')?.toString() || '0');

		if (!adminId) {
			return fail(400, { error: '管理者IDが不正です' });
		}

		// 自分自身は削除できない
		if (adminId === session.adminId) {
			return fail(400, { error: '自分自身は削除できません' });
		}

		// 最高管理者は削除できない
		const targetAdmin = db.select().from(admins).where(eq(admins.id, adminId)).get();
		if (targetAdmin?.role === 'superadmin') {
			return fail(400, { error: '最高管理者は削除できません' });
		}

		await db.delete(admins).where(eq(admins.id, adminId));

		return { success: true, message: '管理者を削除しました' };
	},

	// 新規スレッド作成
	createThread: async ({ request, cookies }) => {
		const session = getSession(cookies);
		if (!session) {
			return fail(403, { error: '権限がありません' });
		}

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
	deleteThread: async ({ request, cookies }) => {
		const session = getSession(cookies);
		if (!session) {
			return fail(403, { error: '権限がありません' });
		}

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
	deletePost: async ({ request, cookies }) => {
		const session = getSession(cookies);
		if (!session) {
			return fail(403, { error: '権限がありません' });
		}

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
	banIp: async ({ request, cookies }) => {
		const session = getSession(cookies);
		if (!session) {
			return fail(403, { error: '権限がありません' });
		}

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
	unbanIp: async ({ request, cookies }) => {
		const session = getSession(cookies);
		if (!session) {
			return fail(403, { error: '権限がありません' });
		}

		const formData = await request.formData();
		const banId = parseInt(formData.get('banId')?.toString() || '0');

		if (!banId) {
			return fail(400, { error: '規制IDが不正です' });
		}

		await db.delete(bannedIps).where(eq(bannedIps.id, banId));

		return { success: true, message: 'IP規制を解除しました' };
	}
};
