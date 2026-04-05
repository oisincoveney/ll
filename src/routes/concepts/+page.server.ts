import { db } from '$lib/server/db';
import { concepts, episodeConcepts } from '$lib/server/db/schema';
import { count, eq } from 'drizzle-orm';

export async function load() {
	const allConcepts = db.select().from(concepts).orderBy(concepts.category, concepts.name).all();

	const categories = new Map<string, { total: number; mastered: number; concepts: number; slug: string }>();

	for (const c of allConcepts) {
		const cat = c.category || 'Uncategorized';
		const existing = categories.get(cat) ?? { total: 0, mastered: 0, concepts: 0, slug: cat.toLowerCase().replace(/\s+/g, '-') };
		existing.total++;
		existing.concepts++;
		if (c.mastery >= 3) existing.mastered++;
		categories.set(cat, existing);
	}

	// Count episode links per category
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
		totalMastered: allConcepts.filter((c) => c.mastery >= 3).length
	};
}
