CREATE TABLE `concepts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text,
	`mastery` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `concepts_slug_unique` ON `concepts` (`slug`);--> statement-breakpoint
CREATE TABLE `episode_concepts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`episode_id` integer NOT NULL,
	`concept_id` integer NOT NULL,
	`role` text DEFAULT 'introduced' NOT NULL,
	`summary` text,
	`rule` text,
	`examples` text,
	`notes` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`episode_id`) REFERENCES `episodes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`concept_id`) REFERENCES `concepts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `episode_summaries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`episode_id` integer NOT NULL,
	`summary` text NOT NULL,
	`vocabulary_json` text,
	FOREIGN KEY (`episode_id`) REFERENCES `episodes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `episode_summaries_episode_id_unique` ON `episode_summaries` (`episode_id`);--> statement-breakpoint
CREATE TABLE `episodes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`number` integer NOT NULL,
	`title` text NOT NULL,
	`listened` integer DEFAULT false NOT NULL,
	`listened_at` text,
	`transcript_path` text,
	`playback_position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `episodes_number_unique` ON `episodes` (`number`);--> statement-breakpoint
CREATE TABLE `lingq_sync_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`synced_at` text NOT NULL,
	`cards_processed` integer NOT NULL,
	`cards_matched` integer NOT NULL,
	`status` text NOT NULL,
	`error` text
);
--> statement-breakpoint
CREATE TABLE `words` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`spanish` text NOT NULL,
	`english` text NOT NULL,
	`example` text,
	`episode_id` integer NOT NULL,
	`lingq_id` integer,
	`lingq_status` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`episode_id`) REFERENCES `episodes`(`id`) ON UPDATE no action ON DELETE no action
);
