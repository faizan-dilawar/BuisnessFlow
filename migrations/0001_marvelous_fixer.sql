ALTER TABLE `invoices` MODIFY COLUMN `date` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `due_date` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `created_at` timestamp DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` ADD `role` enum('admin') DEFAULT 'admin';--> statement-breakpoint
ALTER TABLE `users` ADD `updated_at` timestamp DEFAULT (now());