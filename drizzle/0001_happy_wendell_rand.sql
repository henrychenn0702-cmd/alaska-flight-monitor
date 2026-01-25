CREATE TABLE `monitorLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`status` enum('success','error','found_deal') NOT NULL,
	`datesChecked` int DEFAULT 0,
	`dealsFound` int DEFAULT 0,
	`errorMessage` text,
	`checkedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monitorLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`flightDates` text NOT NULL,
	`sent` int NOT NULL DEFAULT 0,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `priceRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`flightDate` varchar(10) NOT NULL,
	`miles` int NOT NULL,
	`fees` int NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `priceRecords_id` PRIMARY KEY(`id`)
);
