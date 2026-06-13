CREATE TABLE "training_facilitator_invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "training_id" uuid NOT NULL REFERENCES "trainings"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "role" text NOT NULL,
  "token" text NOT NULL UNIQUE,
  "invited_by" text NOT NULL REFERENCES "users"("id"),
  "status" text NOT NULL DEFAULT 'pending',
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX "facilitator_inv_training_idx" ON "training_facilitator_invitations" ("training_id");
CREATE INDEX "facilitator_inv_email_idx" ON "training_facilitator_invitations" ("email");
