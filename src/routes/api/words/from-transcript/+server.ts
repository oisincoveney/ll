import { db } from '$lib/server/db';
import { words, episodes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { lookupCard, createCard } from '$lib/server/lingq';
import { json, error } from '@sveltejs/kit';

export async function POST({ request }) {
	const body = await request.json();
	const { term, sentence, episodeNumber } = body;

	if (!term?.trim() || !episodeNumber) {
		throw error(400, 'term and episodeNumber are required');
	}

	const episode = db.select().from(episodes).where(eq(episodes.number, episodeNumber)).get();
	if (!episode) throw error(404, 'Episode not found');

	// Check if word already exists for this episode
	const existing = db
		.select()
		.from(words)
		.where(eq(words.episodeId, episode.id))
		.all()
		.find((w) => w.spanish.toLowerCase() === term.trim().toLowerCase());

	if (existing) {
		return json({ word: existing, created: false });
	}

	// Look up or create on LingQ
	let card = await lookupCard(term.trim());
	if (!card) {
		card = await createCard(term.trim(), sentence?.trim() || '');
	}

	const english =
		card.hints
			.filter((h) => h.locale === 'en')
			.sort((a, b) => b.popularity - a.popularity)
			.map((h) => h.text)
			.join(', ') || '';

	const result = db
		.insert(words)
		.values({
			spanish: card.term,
			english,
			example: sentence?.trim() || null,
			episodeId: episode.id,
			lingqId: card.pk,
			lingqStatus: card.status,
			createdAt: new Date().toISOString()
		})
		.returning()
		.get();

	return json({ word: result, created: true }, { status: 201 });
}
