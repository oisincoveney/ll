import { db } from '$lib/server/db';
import { words, lingqSyncLog } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fetchAllCards } from '$lib/server/lingq';
import { json } from '@sveltejs/kit';

export async function POST() {
	try {
		const cards = await fetchAllCards();
		const localWords = db.select().from(words).all();

		let matched = 0;
		for (const word of localWords) {
			const card = cards.find(
				(c) => c.term.toLowerCase() === word.spanish.toLowerCase()
			);
			if (card) {
				db.update(words)
					.set({ lingqId: card.pk, lingqStatus: card.status })
					.where(eq(words.id, word.id))
					.run();
				matched++;
			}
		}

		db.insert(lingqSyncLog)
			.values({
				syncedAt: new Date().toISOString(),
				cardsProcessed: cards.length,
				cardsMatched: matched,
				status: 'success'
			})
			.run();

		return json({ ok: true, cardsProcessed: cards.length, cardsMatched: matched });
	} catch (e) {
		console.error('LingQ sync error:', e);
		const errorMsg = e instanceof Error ? `${e.message} (${e.cause ?? 'no cause'})` : 'Unknown error';
		db.insert(lingqSyncLog)
			.values({
				syncedAt: new Date().toISOString(),
				cardsProcessed: 0,
				cardsMatched: 0,
				status: 'error',
				error: errorMsg
			})
			.run();

		return json({ ok: false, error: errorMsg }, { status: 500 });
	}
}
