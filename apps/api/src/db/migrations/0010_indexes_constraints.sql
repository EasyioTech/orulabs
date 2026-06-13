-- P4-1: Missing indexes on frequently-queried foreign key columns
CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS participants_user_id_idx ON training_participants(user_id);
CREATE INDEX IF NOT EXISTS facilitators_user_id_idx ON training_facilitators(user_id);
CREATE INDEX IF NOT EXISTS responses_user_id_idx ON participant_responses(user_id);
CREATE INDEX IF NOT EXISTS live_sessions_training_status_idx ON live_sessions(training_id, status);

-- P4-2: CHECK constraints on enum-like text fields
ALTER TABLE trainings
  ADD CONSTRAINT trainings_session_status_check
  CHECK (session_status IN ('draft', 'connecting', 'live', 'paused', 'completed'));

ALTER TABLE training_facilitators
  ADD CONSTRAINT facilitators_role_check
  CHECK (role IN ('lead_trainer', 'full_editor', 'partial_editor', 'facilitation_support'));

ALTER TABLE live_sessions
  ADD CONSTRAINT live_sessions_status_check
  CHECK (status IN ('active', 'completed'));

-- P4-3: FK on currentActiveModuleId (was missing — allows orphaned references)
ALTER TABLE trainings
  ADD CONSTRAINT trainings_current_active_module_fk
  FOREIGN KEY (current_active_module_id)
  REFERENCES training_modules(id)
  ON DELETE SET NULL;

-- P4-5: Add updatedAt to workspaces
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- P4-6: Text length constraints
ALTER TABLE users
  ADD CONSTRAINT users_name_length CHECK (char_length(name) <= 100);

ALTER TABLE workspaces
  ADD CONSTRAINT workspaces_name_length CHECK (char_length(name) <= 100);

ALTER TABLE trainings
  ADD CONSTRAINT trainings_title_length CHECK (char_length(title) <= 200);
