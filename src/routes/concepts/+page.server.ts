import { db } from '$lib/server/db';
import { concepts, episodeConcepts, userConcepts } from '$lib/server/db/schema';
import { count, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;

	const allConcepts = db.select().from(concepts).orderBy(concepts.category, concepts.name).all();

	const userConceptRows = db
		.select()
		.from(userConcepts)
		.where(eq(userConcepts.userId, userId))
		.all();

	const masteryMap = new Map(userConceptRows.map((uc) => [uc.conceptId, uc.mastery]));

	const categories = new Map<string, { total: number; mastered: number; concepts: number; slug: string }>();

	for (const c of allConcepts) {
		const cat = c.category || 'Uncategorized';
		const existing = categories.get(cat) ?? { total: 0, mastered: 0, concepts: 0, slug: cat.toLowerCase().replace(/\s+/g, '-') };
		existing.total++;
		existing.concepts++;
		if ((masteryMap.get(c.id) ?? 0) >= 3) existing.mastered++;
		categories.set(cat, existing);
	}

	const episodeLinks = db
		.select({ conceptId: episodeConcepts.conceptId, linkCount: count() })
		.from(episodeConcepts)
		.groupBy(episodeConcepts.conceptId)
		.all();

	const linkMap = new Map(episodeLinks.map((l) => [l.conceptId, l.linkCount]));

	const categoryEpisodeCounts = new Map<string, number>();
	for (const c of allConcepts) {
		const cat = c.category || 'Uncategorized';
		const current = categoryEpisodeCounts.get(cat) ?? 0;
		categoryEpisodeCounts.set(cat, current + (linkMap.get(c.id) ?? 0));
	}

	return {
		categories: [...categories.entries()].map(([name, data]) => ({
			name,
			slug: data.slug,
			conceptCount: data.concepts,
			masteredCount: data.mastered,
			episodeLinkCount: categoryEpisodeCounts.get(name) ?? 0
		})),
		totalConcepts: allConcepts.length,
		totalMastered: allConcepts.filter((c) => (masteryMap.get(c.id) ?? 0) >= 3).length
	};
};
