CREATE TABLE `call_issues` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`call_id` text NOT NULL,
	`issue_id` text NOT NULL,
	FOREIGN KEY (`call_id`) REFERENCES `calls`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `call_issue_idx` ON `call_issues` (`call_id`,`issue_id`);--> statement-breakpoint
CREATE TABLE `dossier_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`issue_id` text NOT NULL,
	`version` integer NOT NULL,
	`fingerprint` text NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dossier_version_idx` ON `dossier_versions` (`issue_id`,`version`);--> statement-breakpoint
CREATE TABLE `follow_up_run_issues` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`follow_up_run_id` text NOT NULL,
	`issue_id` text NOT NULL,
	FOREIGN KEY (`follow_up_run_id`) REFERENCES `follow_up_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `run_issue_idx` ON `follow_up_run_issues` (`follow_up_run_id`,`issue_id`);--> statement-breakpoint
CREATE TABLE `follow_up_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`contact_id` text NOT NULL,
	`scope` text NOT NULL,
	`locality_id` text,
	`state` text NOT NULL,
	`brief` text,
	`request_id` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`locality_id`) REFERENCES `localities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `follow_up_runs_request_id_unique` ON `follow_up_runs` (`request_id`);--> statement-breakpoint
CREATE TABLE `intake_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`execution_id` text,
	`state` text NOT NULL,
	`draft` text,
	`submitted_issue_id` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`submitted_issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `intake_sessions_execution_id_unique` ON `intake_sessions` (`execution_id`);--> statement-breakpoint
ALTER TABLE `calls` ADD `follow_up_run_id` text REFERENCES follow_up_runs(id);--> statement-breakpoint
ALTER TABLE `contacts` ADD `display_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `contacts` ADD `language` text DEFAULT 'hi' NOT NULL;--> statement-breakpoint
ALTER TABLE `contacts` ADD `publication_consent` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `follow_up_jobs` ADD `follow_up_run_id` text REFERENCES follow_up_runs(id);