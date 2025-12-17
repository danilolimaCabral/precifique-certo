ALTER TABLE `materials` DROP INDEX `materials_sku_unique`;--> statement-breakpoint
ALTER TABLE `products` DROP INDEX `products_sku_unique`;--> statement-breakpoint
ALTER TABLE `customCharges` ADD `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `marketplaces` ADD `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `materials` ADD `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `pricingRecords` ADD `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `productMaterials` ADD `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `shippingRanges` ADD `userId` int NOT NULL;