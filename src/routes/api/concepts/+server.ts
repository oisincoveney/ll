import { db } from '$lib/server/db';
import { concepts } from '$lib/server/db/schema';
import { json, error } from '@sveltejs/kit';

export async function POST({ request }) {
	const body = await request.json();
	if (!body.name?.trim()) throw error(400, 'name is required');

	if (!body.slug?.trim()) throw error(400, 'slug is required');

	const result = db
		.insert(concepts)
		.values({
			slug: body.slug.trim(),
			name: body.name.trim(),
			description: body.description?.trim() || null,
			category: body.category?.trim() || null
		})
		.returning()
		.get();

	return json(result, { status: 201 });
}
