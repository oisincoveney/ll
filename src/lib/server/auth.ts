import { db } from '$lib/server/db';
import { sessions, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';

export type SessionUser = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;

export function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	return encodeBase32LowerCaseNoPadding(bytes);
}

export function generateUserId(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return encodeHexLowerCase(bytes);
}

function hashToken(token: string): string {
	return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export function createSession(token: string, userId: string): Session {
	const sessionId = hashToken(token);
	const expiresAt = Math.floor((Date.now() + SESSION_DURATION_MS) / 1000);
	const session: Session = { id: sessionId, userId, expiresAt };
	db.insert(sessions).values(session).run();
	return session;
}

export type SessionValidationResult =
	| { session: Session; user: SessionUser }
	| { session: null; user: null };

export function validateSessionToken(token: string): SessionValidationResult {
	const sessionId = hashToken(token);
	const result = db
		.select({ session: sessions, user: users })
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, sessionId))
		.get();

	if (!result) return { session: null, user: null };

	const { session, user } = result;
	const now = Math.floor(Date.now() / 1000);

	if (now >= session.expiresAt) {
		db.delete(sessions).where(eq(sessions.id, sessionId)).run();
		return { session: null, user: null };
	}

	// Refresh if within 15 days of expiry
	if (now >= session.expiresAt - 60 * 60 * 24 * 15) {
		const newExpiry = Math.floor((Date.now() + SESSION_DURATION_MS) / 1000);
		db.update(sessions).set({ expiresAt: newExpiry }).where(eq(sessions.id, sessionId)).run();
		session.expiresAt = newExpiry;
	}

	return { session, user };
}

export function invalidateSession(sessionId: string): void {
	db.delete(sessions).where(eq(sessions.id, sessionId)).run();
}

export function setSessionCookie(cookies: import('@sveltejs/kit').Cookies, token: string, expiresAt: number) {
	cookies.set('session', token, {
		httpOnly: true,
		sameSite: 'lax',
		secure: true,
		path: '/',
		expires: new Date(expiresAt * 1000)
	});
}

export function deleteSessionCookie(cookies: import('@sveltejs/kit').Cookies) {
	cookies.delete('session', { path: '/' });
}
