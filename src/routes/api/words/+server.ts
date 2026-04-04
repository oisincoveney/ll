import { db } from '$lib/server/db';
import { words } from '$lib/server/db/schema';
import { json, error } from '@sveltejs/kit';

export async function POST({ request }) {
	const body = await request.json();
	if (!body.spanish?.trim() || !body.english?.trim() || !body.episodeId) {
		throw error(400, 'spanish, english, and episodeId are required');
	}

	const result = db
		.insert(words)
		.values({
			spanish: body.spanish.trim(),
			english: body.english.trim(),
			example: body.example?.trim() || null,
			episodeId: body.episodeId,
			createdAt: new Date().toISOString()
		})
		.returning()
		.get();

	return json(result, { status: 201 });
}
