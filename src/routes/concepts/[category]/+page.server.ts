import { db } from '$lib/server/db';
import { concepts, episodeConcepts, episodes, userConcepts } from '$lib/server/db/schema';
import { eq, asc, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const userId = locals.user!.id;
	const categorySlug = params.category;

	const allConcepts = db.select().from(concepts).orderBy(concepts.name).all();
	const categoryConcepts = allConcepts.filter(
		(c) => (c.category || 'Uncategorized').toLowerCase().replace(/\s+/g, '-') === categorySlug
	);

	if (categoryConcepts.length === 0) throw error(404, 'Category not found');

	const categoryName = categoryConcepts[0].category || 'Uncategorized';

	// Load user mastery for these concepts
	const conceptIds = categoryConcepts.map((c) => c.id);
	const userConceptRows = db
		.select()
		.from(userConcepts)
		.where(eq(userConcepts.userId, userId))
		.all()
		.filter((uc) => conceptIds.includes(uc.conceptId));
	const masteryMap = new Map(userConceptRows.map((uc) => [uc.conceptId, uc.mastery]));

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
			mastery: masteryMap.get(c.id) ?? 0,
			episodes: (linkMap.get(c.id) ?? []).map((ep) => ({
				...ep,
				examples: ep.examples ? JSON.parse(ep.examples) as Array<{ spanish: string; english: string }> : []
			}))
		})),
		prevCategory: prevCategory ? { name: prevCategory, slug: toSlug(prevCategory) } : null,
		nextCategory: nextCategory ? { name: nextCategory, slug: toSlug(nextCategory) } : null
	};
};

export const actions: Actions = {
	updateMastery: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const formData = await request.formData();
		const conceptId = Number(formData.get('id'));
		const mastery = Number(formData.get('mastery'));

		const existing = db
			.select()
			.from(userConcepts)
			.where(and(eq(userConcepts.userId, userId), eq(userConcepts.conceptId, conceptId)))
			.get();

		if (existing) {
			db.update(userConcepts).set({ mastery }).where(eq(userConcepts.id, existing.id)).run();
		} else {
			db.insert(userConcepts).values({ userId, conceptId, mastery }).run();
		}
	}
};
