ALTER TABLE `users` ADD `trialPlanId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `trialStartedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `trialUsed` boolean DEFAULT false NOT NULL;