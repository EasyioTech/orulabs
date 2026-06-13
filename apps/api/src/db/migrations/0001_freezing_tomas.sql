
ALTER TABLE "trainings" ADD COLUMN IF NOT EXISTS "labels" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "trainings" ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'in_person' NOT NULL;--> statement-breakpoint
ALTER TABLE "trainings" ADD COLUMN IF NOT EXISTS "venue" text;--> statement-breakpoint
ALTER TABLE "trainings" ADD COLUMN IF NOT EXISTS "meeting_link" text;--> statement-breakpoint
ALTER TABLE "trainings" ADD COLUMN IF NOT EXISTS "start_date" timestamp;--> statement-breakpoint
ALTER TABLE "trainings" ADD COLUMN IF NOT EXISTS "end_date" timestamp;