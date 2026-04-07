import { invalidateSession, deleteSessionCookie } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, cookies }) => {
	if (locals.session) {
		invalidateSession(locals.session.id);
	}
	deleteSessionCookie(cookies);
	redirect(302, '/auth/signin');
};
