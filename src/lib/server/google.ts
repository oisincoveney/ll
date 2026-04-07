import { Google } from 'arctic';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';

export function makeGoogleClient(redirectURI: string) {
	return new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectURI);
}

export function getRedirectURI(url: URL): string {
	return `${url.origin}/auth/callback/google`;
}
