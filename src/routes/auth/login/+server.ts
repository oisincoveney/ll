import { makeGoogleClient, getRedirectURI } from '$lib/server/google';
import { generateCodeVerifier, generateState } from 'arctic';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, url: requestURL }) => {
	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const redirectURI = getRedirectURI(requestURL);

	const google = makeGoogleClient(redirectURI);
	const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'email', 'profile']);

	cookies.set('google_oauth_state', state, {
		httpOnly: true,
		sameSite: 'lax',
		secure: true,
		path: '/',
		maxAge: 60 * 10 // 10 minutes
	});

	cookies.set('google_code_verifier', codeVerifier, {
		httpOnly: true,
		sameSite: 'lax',
		secure: true,
		path: '/',
		maxAge: 60 * 10
	});

	redirect(302, url.toString());
};
