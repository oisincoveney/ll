import { db } from '$lib/server/db';
import { words, episodes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function load() {
	const allWords = db
		.select({
			id: words.id,
			spanish: words.spanish,
			english: words.english,
			example: words.example,
			episodeNumber: episodes.number,
			episodeTitle: episodes.title,
			lingqStatus: words.lingqStatus
		})
		.from(words)
		.innerJoin(episodes, eq(words.episodeId, episodes.id))
		.orderBy(episodes.number)
		.all();

	return { words: allWords };
}
