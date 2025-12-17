CREATE TABLE `taxRegimes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`defaultRate` decimal(5,2) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`isSystem` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taxRegimes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `settings` ADD `taxRegimeId` int;