CREATE TABLE `device_verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`code_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`send_count` integer DEFAULT 1 NOT NULL,
	`last_sent_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `device_verifications_session_id_unique` ON `device_verifications` (`session_id`);--> statement-breakpoint
CREATE TABLE `trusted_devices` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`fingerprint_hash` text NOT NULL,
	`label` text NOT NULL,
	`ip_address` text,
	`country` text,
	`created_at` integer NOT NULL,
	`last_used_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trusted_devices_token_hash_unique` ON `trusted_devices` (`token_hash`);--> statement-breakpoint
CREATE INDEX `trusted_devices_user_id_idx` ON `trusted_devices` (`user_id`);--> statement-breakpoint
ALTER TABLE `session` ADD `device_verified` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `session` ADD `trusted_device_id` text;