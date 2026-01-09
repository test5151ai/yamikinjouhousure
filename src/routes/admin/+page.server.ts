import { fail, redirect } from '@sveltejs/kit';
import { db, admins } from '$lib/db';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';
import type { PageServerLoad, Actions } from './$types';

function hashPassword(password: string): string {
	return createHash('sha256').update(password).digest('hex');
}

export const load: PageServerLoad = async ({ cookies }) => {
	const session = cookies.get('admin_session');
	if (session) {
		try {
			const sessionData = JSON.parse(session);
			if (sessionData.authenticated) {
				redirect(302, '/admin/dashboard');
			}
		} catch {
			// Invalid session
		}
	}
	return {};
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get('username')?.toString() || '';
		const password = formData.get('password')?.toString() || '';

		if (!username || !password) {
			return fail(401, { error: 'ユーザー名とパスワードを入力してください' });
		}

		// データベースから管理者を検索
		const admin = db.select().from(admins).where(eq(admins.username, username)).get();

		if (!admin) {
			return fail(401, { error: 'ユーザー名またはパスワードが間違っています' });
		}

		// パスワード検証
		const hashedPassword = hashPassword(password);
		if (admin.password !== hashedPassword) {
			return fail(401, { error: 'ユーザー名またはパスワードが間違っています' });
		}

		// セッションCookieを設定
		const sessionData = {
			authenticated: true,
			adminId: admin.id,
			username: admin.username,
			role: admin.role
		};

		cookies.set('admin_session', JSON.stringify(sessionData), {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 // 24時間
		});

		redirect(302, '/admin/dashboard');
	}
};
