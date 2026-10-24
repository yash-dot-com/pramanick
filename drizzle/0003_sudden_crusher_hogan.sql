CREATE TABLE `agent_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`issue_id` text,
	`intake_session_id` text,
	`follow_up_run_id` text,
	`call_id` text,
	`action` text NOT NULL,
	`state` text NOT NULL,
	`summary` text NOT NULL,
	`detail` text,
	`updated_at` text NOT NULL,
	`dedupe_key` text,
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`intake_session_id`) REFERENCES `intake_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`follow_up_run_id`) REFERENCES `follow_up_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`call_id`) REFERENCES `calls`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_activities_dedupe_key_unique` ON `agent_activities` (`dedupe_key`);--> statement-breakpoint
CREATE TABLE `agent_routines` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`locality_id` text NOT NULL,
	`state` text DEFAULT 'paused' NOT NULL,
	`interval_minutes` integer DEFAULT 2 NOT NULL,
	`next_scan_at` text NOT NULL,
	`last_scan_at` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`locality_id`) REFERENCES `localities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `routine_locality_idx` ON `agent_routines` (`locality_id`);--> statement-breakpoint
CREATE TABLE `casework_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`issue_id` text NOT NULL,
	`input_fingerprint` text NOT NULL,
	`state` text NOT NULL,
	`related_issue_ids` text NOT NULL,
	`contact_candidates` text NOT NULL,
	`next_action` text NOT NULL,
	`follow_up_run_id` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`follow_up_run_id`) REFERENCES `follow_up_runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `casework_plan_issue_idx` ON `casework_plans` (`issue_id`);--> statement-breakpoint
ALTER TABLE `intake_sessions` ADD `language` text DEFAULT 'hi' NOT NULL;--> statement-breakpoint
ALTER TABLE `intake_sessions` ADD `inference` text;--> statement-breakpoint
ALTER TABLE `intake_sessions` ADD `transcript` text;--> statement-breakpoint
ALTER TABLE `intake_sessions` ADD `provider_status` text;