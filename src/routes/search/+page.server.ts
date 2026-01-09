import { db, threads } from '$lib/db';
import { desc } from 'drizzle-orm';
import { calculateMomentum } from '$lib/utils/id';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const query = url.searchParams.get('q') || '闇金情報スレ';

	const threadList = await db
		.select()
		.from(threads)
		.orderBy(desc(threads.updatedAt))
		.all();

	const threadsWithMomentum = threadList.map((thread) => ({
		...thread,
		momentum: calculateMomentum(thread.postCount, thread.createdAt),
		createdAt: thread.createdAt.toISOString(),
		updatedAt: thread.updatedAt.toISOString()
	}));

	// 勢い順でソート
	threadsWithMomentum.sort((a, b) => b.momentum - a.momentum);

	return {
		query,
		threads: threadsWithMomentum
	};
};
