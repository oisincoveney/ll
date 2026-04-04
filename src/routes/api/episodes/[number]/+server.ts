import { db } from '$lib/server/db';
import { episodes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { json, error } from '@sveltejs/kit';

export async function PATCH({ params, request }) {
	const num = parseInt(params.number);
	if (isNaN(num)) throw error(400, 'Invalid episode number');

	const body = await request.json();
	const listened = Boolean(body.listened);

	db.update(episodes)
		.set({
			listened,
			listenedAt: listened ? new Date().toISOString() : null
		})
		.where(eq(episodes.number, num))
		.run();

	return json({ ok: true });
}
