import { db } from '$lib/server/db';
import { words } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const id = parseInt(params.id);
	if (isNaN(id)) throw error(400, 'Invalid word ID');

	const body = await request.json();
	db.update(words)
		.set({
			spanish: body.spanish?.trim(),
			english: body.english?.trim(),
			example: body.example?.trim() || null
		})
		.where(and(eq(words.id, id), eq(words.userId, userId)))
		.run();

	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const id = parseInt(params.id);
	if (isNaN(id)) throw error(400, 'Invalid word ID');

	db.delete(words).where(and(eq(words.id, id), eq(words.userId, userId))).run();
	return json({ ok: true });
};
