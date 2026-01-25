CREATE TABLE `filterSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`targetMiles` int NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `filterSettings_id` PRIMARY KEY(`id`)
);
