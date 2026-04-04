import { db } from '$lib/server/db';
import { concepts, episodeConcepts, episodes } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function load() {
	const allConcepts = db.select().from(concepts).orderBy(concepts.category, concepts.name).all();

	const links = db
		.select({
			conceptId: episodeConcepts.conceptId,
			episodeNumber: episodes.number,
			episodeTitle: episodes.title,
			role: episodeConcepts.role,
			summary: episodeConcepts.summary,
			rule: episodeConcepts.rule,
			examples: episodeConcepts.examples,
			notes: episodeConcepts.notes
		})
		.from(episodeConcepts)
		.innerJoin(episodes, eq(episodeConcepts.episodeId, episodes.id))
		.orderBy(asc(episodes.number))
		.all();

	const linkMap = new Map<number, typeof links>();
	for (const link of links) {
		const existing = linkMap.get(link.conceptId) ?? [];
		existing.push(link);
		linkMap.set(link.conceptId, existing);
	}

	return {
		concepts: allConcepts.map((c) => ({
			...c,
			episodes: (linkMap.get(c.id) ?? []).map((ep) => ({
				...ep,
				examples: ep.examples ? JSON.parse(ep.examples) as Array<{ spanish: string; english: string }> : []
			}))
		}))
	};
}

export const actions = {
	updateMastery: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		const mastery = Number(formData.get('mastery'));
		db.update(concepts).set({ mastery }).where(eq(concepts.id, id)).run();
	}
};
