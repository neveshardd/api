CREATE TABLE `timesheet_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`show_logo` integer DEFAULT true NOT NULL,
	`title` text NOT NULL,
	`footer_line1` text NOT NULL,
	`footer_line2` text NOT NULL,
	`footer_line3` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `employees` ADD `cpf` text;--> statement-breakpoint
CREATE UNIQUE INDEX `employees_cpf_unique` ON `employees` (`cpf`);
--> statement-breakpoint
-- Cabeçalho e rodapé padrão, iguais à folha de ponto atual da AGAGE (editáveis no painel).
INSERT INTO `timesheet_settings` (`id`, `show_logo`, `title`, `footer_line1`, `footer_line2`, `footer_line3`, `updated_at`) VALUES
  ('default', 1, 'Folha de Ponto', 'AGAGE MONTAGEM INDUSTRIAL LTDA – CNPJ: 51.615.570/0001-27', 'Sia Trecho 03 Lote 990 Sala 210 – Zona Industrial (Guará) - Brasília - DF CEP: 71.200-030', 'Telefone: 61. 9.9642-6100 / E-mail: administrativo@agage.com.br', CAST(strftime('%s','now') AS INTEGER) * 1000);
