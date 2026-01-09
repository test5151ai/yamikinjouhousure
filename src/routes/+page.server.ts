import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	redirect(302, `/search?q=${encodeURIComponent('闇金情報スレ')}`);
};
