CREATE TABLE `song_lines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`song_id` integer NOT NULL,
	`line_number` integer NOT NULL,
	`start_ms` integer NOT NULL,
	`spanish` text NOT NULL,
	`english` text,
	FOREIGN KEY (`song_id`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `songs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`artist` text NOT NULL,
	`youtube_id` text NOT NULL,
	`lrc_text` text,
	`teacher_notes` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_words` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`spanish` text NOT NULL,
	`english` text NOT NULL,
	`example` text,
	`episode_id` integer,
	`song_id` integer,
	`lingq_id` integer,
	`lingq_status` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`episode_id`) REFERENCES `episodes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`song_id`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_words`("id", "user_id", "spanish", "english", "example", "episode_id", "song_id", "lingq_id", "lingq_status", "created_at") SELECT "id", "user_id", "spanish", "english", "example", "episode_id", NULL, "lingq_id", "lingq_status", "created_at" FROM `words`;--> statement-breakpoint
DROP TABLE `words`;--> statement-breakpoint
ALTER TABLE `__new_words` RENAME TO `words`;--> statement-breakpoint
PRAGMA foreign_keys=ON;