CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(32) NOT NULL DEFAULT '🏆',
	`xpReward` int NOT NULL DEFAULT 100,
	`rarity` enum('common','rare','epic','legendary') NOT NULL DEFAULT 'common',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`),
	CONSTRAINT `achievements_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `habit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`habitId` int NOT NULL,
	`userId` int NOT NULL,
	`logDate` date NOT NULL,
	`status` enum('completed','missed','skipped') NOT NULL,
	`xpEarned` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `habit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `habits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`icon` varchar(32) NOT NULL DEFAULT '⚡',
	`color` varchar(32) NOT NULL DEFAULT '#6366f1',
	`category` varchar(64) NOT NULL DEFAULT 'General',
	`frequency` enum('daily','weekly') NOT NULL DEFAULT 'daily',
	`xpReward` int NOT NULL DEFAULT 25,
	`notes` text,
	`isArchived` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `habits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quest_definitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(64) NOT NULL,
	`title` varchar(128) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(32) NOT NULL DEFAULT '🎯',
	`xpReward` int NOT NULL DEFAULT 50,
	`targetValue` int NOT NULL DEFAULT 1,
	`questType` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quest_definitions_id` PRIMARY KEY(`id`),
	CONSTRAINT `quest_definitions_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementId` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_daily_quests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questDefinitionId` int NOT NULL,
	`questDate` date NOT NULL,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`progress` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`xpAwarded` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_daily_quests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`xp` bigint NOT NULL DEFAULT 0,
	`level` int NOT NULL DEFAULT 1,
	`tier` varchar(64) NOT NULL DEFAULT 'Novice',
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastActivityDate` date,
	`totalCompleted` int NOT NULL DEFAULT 0,
	`totalMissed` int NOT NULL DEFAULT 0,
	`totalSkipped` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_profiles_userId_unique` UNIQUE(`userId`)
);
