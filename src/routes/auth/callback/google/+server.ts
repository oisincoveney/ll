import { makeGoogleClient, getRedirectURI } from '$lib/server/google';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import {
	generateSessionToken,
	generateUserId,
	createSession,
	setSessionCookie
} from '$lib/server/auth';
import { eq } from 'drizzle-orm';
import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface GoogleUser {
	sub: string;
	email: string;
	name?: string;
	picture?: string;
}

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('google_oauth_state');
	const codeVerifier = cookies.get('google_code_verifier');
	if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
		error(400, 'Invalid OAuth state');
	}

	cookies.delete('google_oauth_state', { path: '/' });
	cookies.delete('google_code_verifier', { path: '/' });

	const google = makeGoogleClient(getRedirectURI(url));

	let tokens;
	try {
		tokens = await google.validateAuthorizationCode(code, codeVerifier);
	} catch {
		error(400, 'Failed to validate authorization code');
	}

	const accessToken = tokens.accessToken();
	const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
		headers: { Authorization: `Bearer ${accessToken}` }
	});

	if (!response.ok) error(500, 'Failed to fetch user info from Google');

	const googleUser: GoogleUser = await response.json();

	// Look up or create user by email
	let user = db.select().from(users).where(eq(users.email, googleUser.email)).get();

	if (!user) {
		user = db
			.insert(users)
			.values({
				id: generateUserId(),
				email: googleUser.email,
				name: googleUser.name ?? null,
				avatar: googleUser.picture ?? null,
				createdAt: new Date().toISOString()
			})
			.returning()
			.get();
	}

	const token = generateSessionToken();
	const session = createSession(token, user.id);
	setSessionCookie(cookies, token, session.expiresAt);

	redirect(302, '/');
};
