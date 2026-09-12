CREATE TABLE `learning_progress` (
	`user_id` text PRIMARY KEY NOT NULL,
	`state_json` text NOT NULL,
	`updated_at` integer NOT NULL
);
