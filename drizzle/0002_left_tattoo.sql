CREATE TABLE `escalations` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`issue_id` text NOT NULL,
	`dossier_version` integer NOT NULL,
	`fingerprint` text NOT NULL,
	`draft` text NOT NULL,
	`state` text DEFAULT 'draft' NOT NULL,
	`submission_reference` text,
	`submission_channel` text,
	`submitted_at` text,
	FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `escalations_fingerprint_unique` ON `escalations` (`fingerprint`);--> statement-breakpoint
ALTER TABLE `evidence` ADD `phase` text DEFAULT 'report' NOT NULL;--> statement-breakpoint
ALTER TABLE `evidence` ADD `location` text;--> statement-breakpoint
ALTER TABLE `evidence` ADD `assessment` text;--> statement-breakpoint
ALTER TABLE `survey_responses` ADD `evidence_id` text REFERENCES evidence(id);