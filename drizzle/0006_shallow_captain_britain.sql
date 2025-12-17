CREATE TABLE `mlCredentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` varchar(255),
	`clientSecret` varchar(255),
	`accessToken` text,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`lastSyncAt` timestamp,
	`isConnected` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mlCredentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `mlCredentials_userId_unique` UNIQUE(`userId`)
);
