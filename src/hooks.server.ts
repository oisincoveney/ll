import { validateSessionToken, setSessionCookie, deleteSessionCookie } from '$lib/server/auth';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import type { Handle } from '@sveltejs/kit';

const DEV_USER = { id: 'dev-local-user', email: 'dev@localhost', name: 'Dev User' } as const;
let devUserSeeded = false;

async function ensureDevUser() {
	if (devUserSeeded) return;
	await db
		.insert(users)
		.values({ id: DEV_USER.id, email: DEV_USER.email, name: DEV_USER.name, createdAt: new Date().toISOString() })
		.onConflictDoNothing();
	devUserSeeded = true;
}

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('session') ?? null;

	if (!token && env.BYPASS_AUTH === 'true') {
		await ensureDevUser();
		event.locals.user = { id: DEV_USER.id, email: DEV_USER.email, name: DEV_USER.name, avatar: null, createdAt: new Date().toISOString() };
		event.locals.session = { id: 'dev-session', userId: DEV_USER.id, expiresAt: Math.floor(Date.now() / 1000) + 86400 };
		return resolve(event);
	}

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
