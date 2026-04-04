import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const episodes = sqliteTable('episodes', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	number: integer('number').notNull().unique(),
	title: text('title').notNull(),
	listened: integer('listened', { mode: 'boolean' }).notNull().default(false),
	listenedAt: text('listened_at'),
	transcriptPath: text('transcript_path')
});

export const words = sqliteTable('words', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	spanish: text('spanish').notNull(),
	english: text('english').notNull(),
	example: text('example'),
	episodeId: integer('episode_id')
		.notNull()
		.references(() => episodes.id),
	lingqId: integer('lingq_id'),
	lingqStatus: integer('lingq_status'),
	createdAt: text('created_at').notNull()
});

export const concepts = sqliteTable('concepts', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	slug: text('slug').notNull().unique(),
	name: text('name').notNull(),
	description: text('description'),
	category: text('category'),
	mastery: integer('mastery').notNull().default(0)
});

export const episodeConcepts = sqliteTable('episode_concepts', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	episodeId: integer('episode_id')
		.notNull()
		.references(() => episodes.id),
	conceptId: integer('concept_id')
		.notNull()
		.references(() => concepts.id),
	role: text('role').notNull().default('introduced'),
	summary: text('summary'),
	rule: text('rule'),
	examples: text('examples'),
	notes: text('notes'),
	sortOrder: integer('sort_order').notNull().default(0)
});

export const episodeSummaries = sqliteTable('episode_summaries', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	episodeId: integer('episode_id')
		.notNull()
		.unique()
		.references(() => episodes.id),
	summary: text('summary').notNull(),
	vocabularyJson: text('vocabulary_json')
});

export const lingqSyncLog = sqliteTable('lingq_sync_log', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	syncedAt: text('synced_at').notNull(),
	cardsProcessed: integer('cards_processed').notNull(),
	cardsMatched: integer('cards_matched').notNull(),
	status: text('status').notNull(),
	error: text('error')
});

export const episodeSummariesRelations = relations(episodeSummaries, ({ one }) => ({
	episode: one(episodes, { fields: [episodeSummaries.episodeId], references: [episodes.id] })
}));

export const episodesRelations = relations(episodes, ({ many, one }) => ({
	words: many(words),
	episodeConcepts: many(episodeConcepts),
	summary: one(episodeSummaries)
}));

export const wordsRelations = relations(words, ({ one }) => ({
	episode: one(episodes, { fields: [words.episodeId], references: [episodes.id] })
}));

export const conceptsRelations = relations(concepts, ({ many }) => ({
	episodeConcepts: many(episodeConcepts)
}));

export const episodeConceptsRelations = relations(episodeConcepts, ({ one }) => ({
	episode: one(episodes, { fields: [episodeConcepts.episodeId], references: [episodes.id] }),
	concept: one(concepts, { fields: [episodeConcepts.conceptId], references: [concepts.id] })
}));
