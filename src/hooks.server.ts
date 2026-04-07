import { validateSessionToken, setSessionCookie, deleteSessionCookie } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('session') ?? null;

	if (!token) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = validateSessionToken(token);

	if (session) {
		setSessionCookie(event.cookies, token, session.expiresAt);
		event.locals.session = session;
		event.locals.user = user;
	} else {
		deleteSessionCookie(event.cookies);
		event.locals.session = null;
		event.locals.user = null;
	}

	return resolve(event);
};
