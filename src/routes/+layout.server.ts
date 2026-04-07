import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Allow auth routes through without a session
	if (url.pathname.startsWith('/auth/')) {
		return { user: locals.user };
	}

	if (!locals.user) {
		redirect(302, '/auth/signin');
	}

	return { user: locals.user };
};
