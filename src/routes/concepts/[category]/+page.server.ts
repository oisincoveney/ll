import { db } from '$lib/server/db';
import { concepts, episodeConcepts, episodes } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const categorySlug = params.category;

	// Find all concepts, then filter by slug match on category
	const allConcepts = db.select().from(concepts).orderBy(concepts.name).all();
	const categoryConcepts = allConcepts.filter(
		(c) => (c.category || 'Uncategorized').toLowerCase().replace(/\s+/g, '-') === categorySlug
	);

	if (categoryConcepts.length === 0) throw error(404, 'Category not found');

	const categoryName = categoryConcepts[0].category || 'Uncategorized';

	// Load episode links for these concepts
	const conceptIds = categoryConcepts.map((c) => c.id);
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
		.all()
		.filter((l) => conceptIds.includes(l.conceptId));

	const linkMap = new Map<number, typeof links>();
	for (const link of links) {
		const existing = linkMap.get(link.conceptId) ?? [];
		existing.push(link);
		linkMap.set(link.conceptId, existing);
	}

	// Find adjacent categories for navigation
	const allCategories = [...new Set(allConcepts.map((c) => c.category || 'Uncategorized'))].sort();
	const currentIndex = allCategories.indexOf(categoryName);
	const prevCategory = currentIndex > 0 ? allCategories[currentIndex - 1] : null;
	const nextCategory = currentIndex < allCategories.length - 1 ? allCategories[currentIndex + 1] : null;

	function toSlug(name: string) {
		return name.toLowerCase().replace(/\s+/g, '-');
	}

	return {
		categoryName,
		categorySlug,
		concepts: categoryConcepts.map((c) => ({
			...c,
			episodes: (linkMap.get(c.id) ?? []).map((ep) => ({
				...ep,
				examples: ep.examples ? JSON.parse(ep.examples) as Array<{ spanish: string; english: string }> : []
			}))
		})),
		prevCategory: prevCategory ? { name: prevCategory, slug: toSlug(prevCategory) } : null,
		nextCategory: nextCategory ? { name: nextCategory, slug: toSlug(nextCategory) } : null
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
