import { db } from '$lib/server/db';
import { episodes, words, episodeConcepts } from '$lib/server/db/schema';
import { eq, count } from 'drizzle-orm';

export async function load() {
	const allEpisodes = db
		.select({
			id: episodes.id,
			number: episodes.number,
			title: episodes.title,
			listened: episodes.listened,
			listenedAt: episodes.listenedAt
		})
		.from(episodes)
		.orderBy(episodes.number)
		.all();

	const wordCounts = db
		.select({ episodeId: words.episodeId, wordCount: count() })
		.from(words)
		.groupBy(words.episodeId)
		.all();

	const conceptCounts = db
		.select({ episodeId: episodeConcepts.episodeId, conceptCount: count() })
		.from(episodeConcepts)
		.groupBy(episodeConcepts.episodeId)
		.all();

	const wordMap = new Map(wordCounts.map((w) => [w.episodeId, w.wordCount]));
	const conceptMap = new Map(conceptCounts.map((c) => [c.episodeId, c.conceptCount]));

	return {
		episodes: allEpisodes.map((ep) => ({
			...ep,
			wordCount: wordMap.get(ep.id) ?? 0,
			conceptCount: conceptMap.get(ep.id) ?? 0
		}))
	};
}

export const actions = {
	toggle: async ({ request }) => {
		const formData = await request.formData();
		const num = Number(formData.get('number'));
		const listened = formData.get('listened') === 'true';

		db.update(episodes)
			.set({
				listened,
				listenedAt: listened ? new Date().toISOString() : null
			})
			.where(eq(episodes.number, num))
			.run();
	}
};
