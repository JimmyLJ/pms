CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`expiresAt` integer,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invitation` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`email` text NOT NULL,
	`role` text,
	`status` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`inviterId` text NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inviterId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `member` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`userId` text NOT NULL,
	`role` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `organization` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text,
	`logo` text,
	`createdAt` integer NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_unique` ON `organization` (`slug`);--> statement-breakpoint
CREATE TABLE `project_member` (
	`id` text PRIMARY KEY NOT NULL,
	`projectId` text NOT NULL,
	`userId` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `project` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'planning',
	`priority` text DEFAULT 'medium',
	`startDate` integer,
	`endDate` integer,
	`leadId` text,
	`progress` integer DEFAULT 0,
	`organizationId` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`leadId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	`activeOrganizationId` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `task` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text NOT NULL,
	`type` text,
	`priority` text DEFAULT 'medium',
	`position` integer DEFAULT 0 NOT NULL,
	`projectId` text NOT NULL,
	`organizationId` text NOT NULL,
	`assigneeId` text,
	`dueDate` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assigneeId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer NOT NULL,
	`image` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer,
	`updatedAt` integer
);
