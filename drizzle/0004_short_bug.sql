CREATE TABLE `translations` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`language` text NOT NULL,
	`source` text NOT NULL,
	`translated` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `agent_routines` ADD `language` text DEFAULT 'mr' NOT NULL;--> statement-breakpoint
ALTER TABLE `follow_up_runs` ADD `language` text DEFAULT 'mr' NOT NULL;--> statement-breakpoint
ALTER TABLE `intake_sessions` ADD `provider` text DEFAULT 'bolna' NOT NULL;--> statement-breakpoint
ALTER TABLE `intake_sessions` ADD `mode` text DEFAULT 'intake' NOT NULL;--> statement-breakpoint
ALTER TABLE `intake_sessions` ADD `issue_id` text REFERENCES issues(id);