CREATE TABLE "training_facilitator_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"training_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token" text NOT NULL,
	"invited_by" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "training_facilitator_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "trainings" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "training_facilitator_invitations" ADD CONSTRAINT "training_facilitator_invitations_training_id_trainings_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_facilitator_invitations" ADD CONSTRAINT "training_facilitator_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "facilitator_inv_training_idx" ON "training_facilitator_invitations" USING btree ("training_id");--> statement-breakpoint
CREATE INDEX "facilitator_inv_email_idx" ON "training_facilitator_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "live_sessions_training_status_idx" ON "live_sessions" USING btree ("training_id","status");--> statement-breakpoint
CREATE INDEX "responses_user_id_idx" ON "participant_responses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "facilitators_user_id_idx" ON "training_facilitators" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "participants_user_id_idx" ON "training_participants" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "image";