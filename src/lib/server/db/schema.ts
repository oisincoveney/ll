import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ── Auth ─────────────────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	name: text('name'),
	avatar: text('avatar'),
	createdAt: text('created_at').notNull()
});

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	expiresAt: integer('expires_at').notNull()
});

// ── Shared catalog ────────────────────────────────────────────────────────────

export const episodes = sqliteTable('episodes', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	number: integer('number').notNull().unique(),
	title: text('title').notNull(),
	transcriptPath: text('transcript_path'),
	// legacy columns retained to avoid destructive migration
	listened: integer('listened', { mode: 'boolean' }),
	listenedAt: text('listened_at'),
	playbackPosition: integer('playback_position')
});

export const concepts = sqliteTable('concepts', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	slug: text('slug').notNull().unique(),
	name: text('name').notNull(),
	description: text('description'),
	category: text('category'),
	// legacy column retained to avoid destructive migration
	mastery: integer('mastery')
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

// ── User-scoped data ──────────────────────────────────────────────────────────

export const userEpisodes = sqliteTable(
	'user_episodes',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		episodeId: integer('episode_id')
			.notNull()
			.references(() => episodes.id),
		listened: integer('listened', { mode: 'boolean' }).notNull().default(false),
		listenedAt: text('listened_at'),
		playbackPosition: integer('playback_position').notNull().default(0)
	},
	(t) => [uniqueIndex('ux_user_episodes').on(t.userId, t.episodeId)]
);

export const words = sqliteTable('words', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: text('user_id').references(() => users.id),
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

export const userConcepts = sqliteTable(
	'user_concepts',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		conceptId: integer('concept_id')
			.notNull()
			.references(() => concepts.id),
		mastery: integer('mastery').notNull().default(0)
	},
	(t) => [uniqueIndex('ux_user_concepts').on(t.userId, t.conceptId)]
);

export const lingqSyncLog = sqliteTable('lingq_sync_log', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: text('user_id').references(() => users.id),
	syncedAt: text('synced_at').notNull(),
	cardsProcessed: integer('cards_processed').notNull(),
	cardsMatched: integer('cards_matched').notNull(),
	status: text('status').notNull(),
	error: text('error')
});

// ── Relations ─────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	userEpisodes: many(userEpisodes),
	words: many(words),
	userConcepts: many(userConcepts)
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] })
}));

export const episodeSummariesRelations = relations(episodeSummaries, ({ one }) => ({
	episode: one(episodes, { fields: [episodeSummaries.episodeId], references: [episodes.id] })
}));

export const episodesRelations = relations(episodes, ({ many, one }) => ({
	words: many(words),
	episodeConcepts: many(episodeConcepts),
	summary: one(episodeSummaries),
	userEpisodes: many(userEpisodes)
}));

export const wordsRelations = relations(words, ({ one }) => ({
	episode: one(episodes, { fields: [words.episodeId], references: [episodes.id] }),
	user: one(users, { fields: [words.userId], references: [users.id] })
}));

export const conceptsRelations = relations(concepts, ({ many }) => ({
	episodeConcepts: many(episodeConcepts),
	userConcepts: many(userConcepts)
}));

export const episodeConceptsRelations = relations(episodeConcepts, ({ one }) => ({
	episode: one(episodes, { fields: [episodeConcepts.episodeId], references: [episodes.id] }),
	concept: one(concepts, { fields: [episodeConcepts.conceptId], references: [concepts.id] })
}));

export const userEpisodesRelations = relations(userEpisodes, ({ one }) => ({
	user: one(users, { fields: [userEpisodes.userId], references: [users.id] }),
	episode: one(episodes, { fields: [userEpisodes.episodeId], references: [episodes.id] })
}));

export const userConceptsRelations = relations(userConcepts, ({ one }) => ({
	user: one(users, { fields: [userConcepts.userId], references: [users.id] }),
	concept: one(concepts, { fields: [userConcepts.conceptId], references: [concepts.id] })
}));
