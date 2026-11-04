CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`revision` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "documents_category_check" CHECK("documents"."category" in ('onboarding', 'occupational-safety', 'institutional')),
	CONSTRAINT "documents_status_check" CHECK("documents"."status" in ('draft', 'active', 'obsolete'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `documents_code_unique` ON `documents` (`code`);--> statement-breakpoint
CREATE INDEX `documents_category_updated_at_idx` ON `documents` (`category`,`updated_at`);