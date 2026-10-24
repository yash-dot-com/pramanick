CREATE TABLE `agent_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`issue_id` text NOT NULL,
	`state` text NOT NULL,
	`prompt_version` text NOT NULL,
	`context` text NOT NULL,
	`error` text,
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `call_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`call_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`call_id`) REFERENCES `calls`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `calls` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`issue_id` text NOT NULL,
	`run_id` text NOT NULL,
	`contact_id` text NOT NULL,
	`execution_id` text,
	`idempotency_key` text NOT NULL,
	`status` text NOT NULL,
	`duration` real,
	`transcript` text,
	`summary` text,
	`outcome` text,
	`recording_url` text,
	`error` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`run_id`) REFERENCES `agent_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `calls_execution_id_unique` ON `calls` (`execution_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `calls_idempotency_key_unique` ON `calls` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `calls_issue_idx` ON `calls` (`issue_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `commitments` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`issue_id` text NOT NULL,
	`source_call_id` text NOT NULL,
	`action` text NOT NULL,
	`due_at` text,
	`status` text DEFAULT 'upcoming' NOT NULL,
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_call_id`) REFERENCES `calls`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `complaints` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`issue_id` text NOT NULL,
	`participant_id` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `complaints_participant_issue_idx` ON `complaints` (`participant_id`,`issue_id`);--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`office_id` text NOT NULL,
	`designation` text NOT NULL,
	`phone` text NOT NULL,
	`authorized` integer DEFAULT false NOT NULL,
	`recording_consent` integer DEFAULT false NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	`revoked_at` text,
	FOREIGN KEY (`office_id`) REFERENCES `offices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`issue_id` text NOT NULL,
	`participant_id` text,
	`caption` text NOT NULL,
	`url` text NOT NULL,
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `follow_up_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`issue_id` text NOT NULL,
	`contact_id` text NOT NULL,
	`kind` text NOT NULL,
	`due_at` text NOT NULL,
	`state` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`call_id` text,
	`error` text,
	`lease_until` text,
	`dedupe_key` text NOT NULL,
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`call_id`) REFERENCES `calls`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `follow_up_jobs_dedupe_key_unique` ON `follow_up_jobs` (`dedupe_key`);--> statement-breakpoint
CREATE INDEX `jobs_due_idx` ON `follow_up_jobs` (`state`,`due_at`);--> statement-breakpoint
CREATE TABLE `issue_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`issue_id` text NOT NULL,
	`office_id` text,
	`certainty` text NOT NULL,
	`reason` text NOT NULL,
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`office_id`) REFERENCES `offices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `issue_events` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`issue_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`source` text NOT NULL,
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `events_issue_idx` ON `issue_events` (`issue_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `issues` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`issue_type` text NOT NULL,
	`locality_id` text NOT NULL,
	`landmark` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`status` text DEFAULT 'reported' NOT NULL,
	`office_id` text,
	`assignment_certainty` text DEFAULT 'unassigned' NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`locality_id`) REFERENCES `localities`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`office_id`) REFERENCES `offices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `issues_match_idx` ON `issues` (`locality_id`,`category`,`issue_type`,`status`);--> statement-breakpoint
CREATE TABLE `localities` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`name` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`source` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `offices` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`name` text NOT NULL,
	`government_body` text NOT NULL,
	`address` text NOT NULL,
	`designation` text NOT NULL,
	`locality_id` text,
	`area_ids` text NOT NULL,
	`lat` real,
	`lng` real,
	`jurisdiction` text NOT NULL,
	`topics` text NOT NULL,
	`source` text NOT NULL,
	`source_as_of` text NOT NULL,
	`verification_status` text NOT NULL,
	`published_phone` text,
	`email` text,
	`person_name` text,
	`notes` text DEFAULT '' NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`locality_id`) REFERENCES `localities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `participants` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`token_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `participants_token_hash_unique` ON `participants` (`token_hash`);--> statement-breakpoint
CREATE TABLE `responsibility_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`locality_id` text NOT NULL,
	`issue_type` text NOT NULL,
	`candidate_owner` text NOT NULL,
	`confirmation_needed` text NOT NULL,
	`confidence` text NOT NULL,
	FOREIGN KEY (`locality_id`) REFERENCES `localities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `survey_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`survey_id` text NOT NULL,
	`participant_id` text NOT NULL,
	`answer` text NOT NULL,
	`note` text NOT NULL,
	FOREIGN KEY (`survey_id`) REFERENCES `surveys`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `survey_participant_idx` ON `survey_responses` (`survey_id`,`participant_id`);--> statement-breakpoint
CREATE TABLE `surveys` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`issue_id` text NOT NULL,
	`source_call_id` text,
	`state` text DEFAULT 'open' NOT NULL,
	`review_note` text,
	`reviewed_at` text,
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_call_id`) REFERENCES `calls`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tool_executions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`run_id` text,
	`tool` text NOT NULL,
	`state` text NOT NULL,
	`detail` text NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `agent_runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `wards` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`name` text NOT NULL,
	`source` text NOT NULL,
	`geometry` text
);
--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`fingerprint` text NOT NULL,
	`execution_id` text NOT NULL,
	`status` text NOT NULL,
	`repeats` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `webhook_events_fingerprint_unique` ON `webhook_events` (`fingerprint`);