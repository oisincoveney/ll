import { db } from '$lib/server/db';
import { concepts, episodeConcepts } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { json, error } from '@sveltejs/kit';

export async function PUT({ params, request }) {
	const id = parseInt(params.id);
	if (isNaN(id)) throw error(400, 'Invalid concept ID');

	const body = await request.json();
	db.update(concepts)
		.set({
			name: body.name?.trim(),
			description: body.description?.trim() || null,
			category: body.category?.trim() || null,
			mastery: body.mastery
		})
		.where(eq(concepts.id, id))
		.run();

	return json({ ok: true });
}

export async function POST({ params, request }) {
	// Link concept to episode
	const id = parseInt(params.id);
	if (isNaN(id)) throw error(400, 'Invalid concept ID');

	const body = await request.json();
	if (!body.episodeId) throw error(400, 'episodeId is required');

	db.insert(episodeConcepts)
		.values({
			conceptId: id,
			episodeId: body.episodeId,
			role: body.role || 'introduced',
			summary: body.summary?.trim() || null,
			rule: body.rule?.trim() || null,
			examples: body.examples ? JSON.stringify(body.examples) : null,
			notes: body.notes?.trim() || null,
			sortOrder: body.sortOrder ?? 0
		})
		.run();

	return json({ ok: true }, { status: 201 });
}
