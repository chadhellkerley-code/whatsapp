CREATE TABLE `automation_flows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`triggerKeywords` json NOT NULL,
	`responseType` enum('static','gemini','flow') NOT NULL DEFAULT 'static',
	`staticResponse` text,
	`geminiApiKey` varchar(500),
	`geminiPrompt` text,
	`flowSteps` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automation_flows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`message` text NOT NULL,
	`targetNumbers` json NOT NULL,
	`status` enum('draft','scheduled','running','completed','failed') NOT NULL DEFAULT 'draft',
	`sentCount` int NOT NULL DEFAULT 0,
	`failedCount` int NOT NULL DEFAULT 0,
	`scheduledAt` timestamp,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`contactNumber` varchar(20) NOT NULL,
	`message` text NOT NULL,
	`direction` enum('incoming','outgoing') NOT NULL,
	`isAutomated` boolean NOT NULL DEFAULT false,
	`campaignId` int,
	`automationFlowId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `message_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`totalMessages` int NOT NULL DEFAULT 0,
	`totalReceived` int NOT NULL DEFAULT 0,
	`totalSent` int NOT NULL DEFAULT 0,
	`automatedResponses` int NOT NULL DEFAULT 0,
	`date` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `message_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `openwa_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`apiKey` varchar(500) NOT NULL,
	`apiUrl` varchar(500) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `openwa_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_numbers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`sessionName` varchar(100) NOT NULL,
	`isConnected` boolean NOT NULL DEFAULT false,
	`connectionStatus` varchar(50) NOT NULL DEFAULT 'disconnected',
	`lastActivity` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_numbers_id` PRIMARY KEY(`id`)
);
