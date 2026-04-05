import { db } from '$lib/server/db';
import { episodes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { json, error } from '@sveltejs/kit';

export async function PATCH({ params, request }) {
	const num = parseInt(params.number);
	if (isNaN(num)) throw error(400, 'Invalid episode number');

	const body = await request.json();
	const updates: Record<string, unknown> = {};

	if ('listened' in body) {
		updates.listened = Boolean(body.listened);
		updates.listenedAt = updates.listened ? new Date().toISOString() : null;
	}

	if ('playbackPosition' in body) {
		updates.playbackPosition = Math.floor(Number(body.playbackPosition));
	}

	if (Object.keys(updates).length === 0) throw error(400, 'No valid fields');

	db.update(episodes).set(updates).where(eq(episodes.number, num)).run();

	return json({ ok: true });
}

// sendBeacon only supports POST — alias for position saves on page unload
export const POST = PATCH;
