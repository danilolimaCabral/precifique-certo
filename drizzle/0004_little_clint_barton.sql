CREATE TABLE `plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(50) NOT NULL,
	`description` text,
	`priceMonthly` decimal(10,2) NOT NULL,
	`priceYearly` decimal(10,2),
	`maxMaterials` int NOT NULL,
	`maxProducts` int NOT NULL,
	`maxMarketplaces` int NOT NULL,
	`hasSimulator` boolean NOT NULL DEFAULT true,
	`hasReports` boolean NOT NULL DEFAULT false,
	`hasExport` boolean NOT NULL DEFAULT false,
	`hasPrioritySupport` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `plans_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `planId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `planExpiresAt` timestamp;