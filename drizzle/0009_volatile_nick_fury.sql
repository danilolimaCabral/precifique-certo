CREATE TABLE `mlFixedFeeRanges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`minPrice` decimal(10,2) NOT NULL,
	`maxPrice` decimal(10,2) NOT NULL,
	`fixedFee` decimal(10,2) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mlFixedFeeRanges_id` PRIMARY KEY(`id`)
);
