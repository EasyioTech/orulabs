CREATE TABLE "live_session_module_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"live_session_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"accumulated_seconds" integer DEFAULT 0 NOT NULL,
	"is_running" boolean DEFAULT true NOT NULL,
	"last_started_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "participant_responses" ADD COLUMN "started_at" timestamp;--> statement-breakpoint
ALTER TABLE "participant_responses" ADD COLUMN "time_spent_seconds" integer;--> statement-breakpoint
ALTER TABLE "live_session_module_stats" ADD CONSTRAINT "live_session_module_stats_live_session_id_live_sessions_id_fk" FOREIGN KEY ("live_session_id") REFERENCES "public"."live_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_session_module_stats" ADD CONSTRAINT "live_session_module_stats_module_id_training_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."training_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "module_stats_session_module_idx" ON "live_session_module_stats" USING btree ("live_session_id","module_id");