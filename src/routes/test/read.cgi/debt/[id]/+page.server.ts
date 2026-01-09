import { error, fail } from '@sveltejs/kit';
import { db, threads, posts, bannedIps, personas } from '$lib/db';
import { eq, asc } from 'drizzle-orm';
import { processBody, calculateSize, formatDate } from '$lib/utils/post';
import { generateUserId, parseName, generatePersonaId } from '$lib/utils/id';
import type { PageServerLoad, Actions } from './$types';

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

export const load: PageServerLoad = async ({ params, cookies }) => {
	const threadId = parseInt(params.id);

	if (isNaN(threadId)) {
		error(404, 'スレッドが見つかりません');
	}

	const thread = await db
		.select()
		.from(threads)
		.where(eq(threads.id, threadId))
		.get();

	if (!thread) {
		error(404, 'スレッドが見つかりません');
	}

	const postList = await db
		.select()
		.from(posts)
		.where(eq(posts.threadId, threadId))
		.orderBy(asc(posts.postNumber))
		.all();

	const size = calculateSize(postList);

	const processedPosts = postList.map((post) => ({
		...post,
		body: processBody(post.body, threadId),
		rawBody: post.body,
		createdAt: formatDate(post.createdAt)
	}));

	// 管理者かどうかチェック
	const session = getSession(cookies);
	const isAdmin = !!session;

	// 管理者の場合はペルソナ一覧も取得
	let personaList: { id: number; name: string }[] = [];
	if (isAdmin) {
		const personasData = await db
			.select()
			.from(personas)
			.orderBy(personas.id)
			.all();
		personaList = personasData.map((p) => ({ id: p.id, name: p.name }));
	}

	return {
		thread: {
			...thread,
			createdAt: thread.createdAt.toISOString(),
			updatedAt: thread.updatedAt.toISOString()
		},
		posts: processedPosts,
		size,
		isAdmin,
		personas: personaList
	};
};

export const actions: Actions = {
	post: async ({ params, request, getClientAddress, cookies }) => {
		const threadId = parseInt(params.id);

		if (isNaN(threadId)) {
			return fail(400, { error: 'スレッドIDが不正です' });
		}

		// スレッド存在確認
		const thread = await db
			.select()
			.from(threads)
			.where(eq(threads.id, threadId))
			.get();

		if (!thread) {
			return fail(404, { error: 'スレッドが見つかりません' });
		}

		// アーカイブ済みチェック
		if (thread.isArchived || thread.postCount >= 1000) {
			return fail(400, { error: 'このスレッドは書き込みできません' });
		}

		// IPアドレス取得
		const ip = getClientAddress();

		// 管理者セッション確認
		const session = getSession(cookies);

		// 一般ユーザーの場合のみIP規制チェック
		if (!session) {
			const banned = await db
				.select()
				.from(bannedIps)
				.where(eq(bannedIps.ipAddress, ip))
				.get();

			if (banned) {
				// 期限チェック
				if (!banned.expiresAt || banned.expiresAt > new Date()) {
					return fail(403, { error: '書き込み規制中です' });
				}
			}
		}

		// フォームデータ取得
		const formData = await request.formData();
		const nameInput = formData.get('name')?.toString() || '';
		const email = formData.get('email')?.toString() || '';
		const body = formData.get('body')?.toString() || '';
		const personaStr = formData.get('persona')?.toString() || '';

		// バリデーション
		if (!body.trim()) {
			return fail(400, { error: '本文を入力してください' });
		}

		if (body.length > 4000) {
			return fail(400, { error: '本文は4000文字以内で入力してください' });
		}

		// 名前・トリップ処理
		const { name, trip } = parseName(nameInput);

		// ユーザーID生成（管理者でペルソナ指定がある場合はペルソナID）
		let userId: string;
		let personaId: number | null = null;
		if (session && personaStr) {
			const persona = parseInt(personaStr);
			userId = generatePersonaId(persona);
			personaId = persona;
		} else {
			userId = generateUserId(ip);
		}

		// 次のレス番号
		const nextPostNumber = thread.postCount + 1;

		const now = new Date();

		// 投稿を保存
		await db.insert(posts).values({
			threadId,
			postNumber: nextPostNumber,
			name: name.substring(0, 100), // 最大100文字
			trip,
			email: email.substring(0, 100),
			body,
			ipAddress: session ? '127.0.0.1' : ip, // 管理者はIP記録しない
			userId,
			createdAt: now,
			isDeleted: false,
			isAdmin: false,
			personaId
		});

		// スレッドの投稿数を更新
		// sageでない場合は更新日時も更新
		const isSage = email.toLowerCase().includes('sage');

		await db
			.update(threads)
			.set({
				postCount: nextPostNumber,
				...(isSage ? {} : { updatedAt: now }),
				...(nextPostNumber >= 1000 ? { isArchived: true } : {})
			})
			.where(eq(threads.id, threadId));

		return { success: true, postNumber: nextPostNumber };
	}
};
