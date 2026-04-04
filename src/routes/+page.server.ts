import { db } from '$lib/server/db';
import { episodes, words, concepts, lingqSyncLog } from '$lib/server/db/schema';
import { count, eq, desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { fetchAllCards } from '$lib/server/lingq';

export async function load() {
	const [{ listenedCount }] = db
		.select({ listenedCount: count() })
		.from(episodes)
		.where(eq(episodes.listened, true))
		.all();

	const [{ wordCount }] = db.select({ wordCount: count() }).from(words).all();
	const [{ conceptCount }] = db.select({ conceptCount: count() }).from(concepts).all();

	const recentEpisodes = db
		.select()
		.from(episodes)
		.where(eq(episodes.listened, true))
		.orderBy(desc(episodes.listenedAt))
		.limit(5)
		.all();

	const lastSync = db
		.select()
		.from(lingqSyncLog)
		.orderBy(desc(lingqSyncLog.syncedAt))
		.limit(1)
		.all();

	return {
		totalEpisodes: 90,
		listenedCount,
		wordCount,
		conceptCount,
		recentEpisodes,
		lastSync: lastSync[0] ?? null
	};
}

export const actions = {
	sync: async () => {
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

			return { synced: true, cardsProcessed: cards.length, cardsMatched: matched };
		} catch (e) {
			const errorMsg = e instanceof Error ? e.message : 'Unknown error';
			db.insert(lingqSyncLog)
				.values({
					syncedAt: new Date().toISOString(),
					cardsProcessed: 0,
					cardsMatched: 0,
					status: 'error',
					error: errorMsg
				})
				.run();

			return fail(500, { error: errorMsg });
		}
	}
};
