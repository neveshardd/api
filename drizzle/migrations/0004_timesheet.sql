CREATE TABLE `employees` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`registration` text,
	`job_title` text,
	`admission_date` text,
	`daily_minutes` integer DEFAULT 480 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_registration_unique` ON `employees` (`registration`);--> statement-breakpoint
CREATE INDEX `employees_active_name_idx` ON `employees` (`active`,`name`);--> statement-breakpoint
CREATE TABLE `time_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`date` text NOT NULL,
	`day_type` text DEFAULT 'work' NOT NULL,
	`clock_in` text,
	`lunch_out` text,
	`lunch_in` text,
	`clock_out` text,
	`overtime_start` text,
	`overtime_end` text,
	`notes` text,
	`updated_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "time_entries_day_type_check" CHECK("time_entries"."day_type" in ('work', 'absence', 'medical', 'day_off', 'holiday', 'vacation'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `time_entries_employee_date_idx` ON `time_entries` (`employee_id`,`date`);--> statement-breakpoint
CREATE INDEX `time_entries_date_idx` ON `time_entries` (`date`);--> statement-breakpoint
CREATE TABLE `time_presets` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`day_type` text DEFAULT 'work' NOT NULL,
	`clock_in` text,
	`lunch_out` text,
	`lunch_in` text,
	`clock_out` text,
	`overtime_start` text,
	`overtime_end` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT "time_presets_day_type_check" CHECK("time_presets"."day_type" in ('work', 'absence', 'medical', 'day_off', 'holiday', 'vacation'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `time_presets_name_unique` ON `time_presets` (`name`);
--> statement-breakpoint
-- Modelos de jornada padrão (podem ser editados ou removidos no painel).
INSERT INTO `time_presets` (`id`, `name`, `day_type`, `clock_in`, `lunch_out`, `lunch_in`, `clock_out`, `overtime_start`, `overtime_end`, `sort_order`, `created_at`) VALUES
  (lower(hex(randomblob(16))), 'Comercial 08:00–17:00', 'work', '08:00', '12:00', '13:00', '17:00', NULL, NULL, 1, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (lower(hex(randomblob(16))), 'Manhã 07:00–16:00', 'work', '07:00', '11:00', '12:00', '16:00', NULL, NULL, 2, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (lower(hex(randomblob(16))), 'Meio período 08:00–12:00', 'work', '08:00', NULL, NULL, '12:00', NULL, NULL, 3, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (lower(hex(randomblob(16))), 'Comercial + 2h extra', 'work', '08:00', '12:00', '13:00', '17:00', '17:00', '19:00', 4, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (lower(hex(randomblob(16))), 'Falta', 'absence', NULL, NULL, NULL, NULL, NULL, NULL, 5, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (lower(hex(randomblob(16))), 'Atestado', 'medical', NULL, NULL, NULL, NULL, NULL, NULL, 6, CAST(strftime('%s','now') AS INTEGER) * 1000),
  (lower(hex(randomblob(16))), 'Folga', 'day_off', NULL, NULL, NULL, NULL, NULL, NULL, 7, CAST(strftime('%s','now') AS INTEGER) * 1000);
