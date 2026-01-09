import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const session = cookies.get('admin_session');
	if (session === 'authenticated') {
		redirect(302, '/admin/dashboard');
	}
	return {};
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const formData = await request.formData();
		const password = formData.get('password')?.toString() || '';

		const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

		if (password !== adminPassword) {
			return fail(401, { error: 'パスワードが間違っています' });
		}

		// セッションCookieを設定
		cookies.set('admin_session', 'authenticated', {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 // 24時間
		});

		redirect(302, '/admin/dashboard');
	}
};
