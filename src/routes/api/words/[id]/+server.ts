import { db } from '$lib/server/db';
import { words } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { json, error } from '@sveltejs/kit';

export async function PUT({ params, request }) {
	const id = parseInt(params.id);
	if (isNaN(id)) throw error(400, 'Invalid word ID');

	const body = await request.json();
	db.update(words)
		.set({
			spanish: body.spanish?.trim(),
			english: body.english?.trim(),
			example: body.example?.trim() || null
		})
		.where(eq(words.id, id))
		.run();

	return json({ ok: true });
}

export async function DELETE({ params }) {
	const id = parseInt(params.id);
	if (isNaN(id)) throw error(400, 'Invalid word ID');

	db.delete(words).where(eq(words.id, id)).run();
	return json({ ok: true });
}
