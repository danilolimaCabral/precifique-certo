CREATE TABLE `customCharges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`chargeType` enum('percent_sale','percent_cost','fixed') NOT NULL,
	`value` decimal(10,2) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customCharges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketplaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`commissionPercent` decimal(5,2) NOT NULL,
	`fixedFee` decimal(10,2) DEFAULT '0',
	`logisticsType` varchar(100),
	`freeShipping` boolean DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplaces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`type` enum('insumo','embalagem') NOT NULL,
	`unitCost` decimal(10,2) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `materials_id` PRIMARY KEY(`id`),
	CONSTRAINT `materials_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `pricingRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`marketplaceId` int NOT NULL,
	`salePrice` decimal(10,2) NOT NULL,
	`ctm` decimal(10,2) NOT NULL,
	`marginValue` decimal(10,2) NOT NULL,
	`marginPercent` decimal(5,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pricingRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productMaterials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`materialId` int NOT NULL,
	`quantity` decimal(10,4) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productMaterials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(100) NOT NULL,
	`name` text NOT NULL,
	`height` decimal(10,2),
	`width` decimal(10,2),
	`length` decimal(10,2),
	`realWeight` decimal(10,2),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taxName` varchar(100) DEFAULT 'Simples Nacional',
	`taxPercent` decimal(5,2) DEFAULT '0',
	`adsPercent` decimal(5,2) DEFAULT '0',
	`opexType` enum('percent','fixed') DEFAULT 'percent',
	`opexValue` decimal(10,2) DEFAULT '0',
	`minMarginTarget` decimal(5,2) DEFAULT '10',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shippingRanges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`marketplaceId` int NOT NULL,
	`minWeight` decimal(10,2) NOT NULL,
	`maxWeight` decimal(10,2) NOT NULL,
	`cost` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shippingRanges_id` PRIMARY KEY(`id`)
);
