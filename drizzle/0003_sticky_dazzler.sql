CREATE TABLE `emailRecipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`name` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailRecipients_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailRecipients_email_unique` UNIQUE(`email`)
);
