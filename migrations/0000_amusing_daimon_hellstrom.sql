CREATE TABLE `companies` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text,
	`gstin` varchar(15),
	`currency` varchar(3) DEFAULT 'USD',
	`timezone` varchar(50) DEFAULT 'UTC',
	`allow_negative_stock` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `counters` (
	`id` varchar(36) NOT NULL,
	`name` varchar(50) NOT NULL,
	`year` int NOT NULL,
	`month` varchar(20) NOT NULL,
	`sequence` int DEFAULT 0,
	CONSTRAINT `counters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255),
	`phone` varchar(20),
	`billing_address` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`vendor` varchar(255) NOT NULL,
	`amount` decimal(14,2) NOT NULL,
	`category` varchar(100) NOT NULL,
	`date` timestamp NOT NULL,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` varchar(36) NOT NULL,
	`invoice_id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`description` varchar(255) NOT NULL,
	`qty` int NOT NULL,
	`unit_price` decimal(14,2) NOT NULL,
	`tax_rate` decimal(5,2) DEFAULT '0.00',
	`line_total` decimal(14,2) NOT NULL,
	CONSTRAINT `invoice_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`customer_id` varchar(36) NOT NULL,
	`invoice_no` varchar(50) NOT NULL,
	`date` timestamp NOT NULL,
	`due_date` timestamp NOT NULL,
	`invoice_status` enum('draft','issued','paid','cancelled') DEFAULT 'draft',
	`sub_total` decimal(14,2) NOT NULL,
	`tax_total` decimal(14,2) NOT NULL,
	`total` decimal(14,2) NOT NULL,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` varchar(36) NOT NULL,
	`invoice_id` varchar(36) NOT NULL,
	`amount` decimal(14,2) NOT NULL,
	`method` varchar(50) NOT NULL,
	`paid_at` timestamp NOT NULL,
	`reference` varchar(255),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`sku` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`price_decimal` decimal(14,2) NOT NULL,
	`cost_decimal` decimal(14,2) NOT NULL,
	`stock_qty` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`passwordHash` text NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
