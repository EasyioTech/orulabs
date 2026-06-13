import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  primaryKey,
  unique,
  index,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { ModuleType } from "@oruclass/types";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  hashedPassword: text("hashed_password"),
  emailVerified: boolean("email_verified").notNull().default(false),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Workspaces ───────────────────────────────────────────────────────────────
export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── WorkspaceMembers ─────────────────────────────────────────────────────────
export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").$type<"owner" | "member">().notNull().default("member"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.userId] })],
);

// ─── Trainings ────────────────────────────────────────────────────────────────
export const trainings = pgTable(
  "trainings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    labels: text("labels").array().notNull().default([]),
    type: text("type").$type<"in_person" | "online" | "hybrid">().notNull().default("in_person"),
    description: text("description"),
    venue: text("venue"),
    meetingLink: text("meeting_link"),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    currentActiveModuleId: uuid("current_active_module_id"), // FK → training_modules.id added via migration 0010
    sessionStatus: text("session_status")
      .$type<"draft" | "connecting" | "live" | "paused" | "completed">()
      .notNull()
      .default("draft"),
    joinToken: text("join_token").notNull().unique(),
    checklist: jsonb("checklist")
      .$type<{ id: string; label: string; done: boolean }[]>()
      .notNull()
      .default([]),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [index("trainings_workspace_idx").on(t.workspaceId)],
);

// ─── TrainingDays ─────────────────────────────────────────────────────────────
export const trainingDays = pgTable(
  "training_days",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trainingId: uuid("training_id")
      .notNull()
      .references(() => trainings.id, { onDelete: "cascade" }),
    dayNumber: integer("day_number").notNull(),
    title: text("title").notNull(),
    date: timestamp("date"),
    deliveryMode: text("delivery_mode").$type<"in_person" | "online" | "hybrid">().default("in_person"),
    description: text("description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("days_training_idx").on(t.trainingId),
    unique("days_training_number_unique").on(t.trainingId, t.dayNumber),
  ],
);

// ─── TrainingModules ──────────────────────────────────────────────────────────
export const trainingModules = pgTable(
  "training_modules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trainingId: uuid("training_id")
      .notNull()
      .references(() => trainings.id, { onDelete: "cascade" }),
    dayId: uuid("day_id").references(() => trainingDays.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    moduleType: text("module_type").$type<ModuleType>().notNull(),
    position: integer("position").notNull().default(0),
    isUnlocked: boolean("is_unlocked").notNull().default(false),
    isAlwaysOn: boolean("is_always_on").notNull().default(false),
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("modules_training_idx").on(t.trainingId)],
);

// ─── TrainingFacilitators ─────────────────────────────────────────────────────
export const trainingFacilitators = pgTable(
  "training_facilitators",
  {
    trainingId: uuid("training_id")
      .notNull()
      .references(() => trainings.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role")
      .$type<"lead_trainer" | "full_editor" | "partial_editor" | "facilitation_support">()
      .notNull(),
    assignedModules: text("assigned_modules").array().notNull().default([]),
  },
  (t) => [
    primaryKey({ columns: [t.trainingId, t.userId] }),
    index("facilitators_user_id_idx").on(t.userId),
  ],
);

// ─── TrainingFacilitatorInvitations ──────────────────────────────────────────
export const trainingFacilitatorInvitations = pgTable(
  "training_facilitator_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trainingId: uuid("training_id")
      .notNull()
      .references(() => trainings.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role")
      .$type<"lead_trainer" | "full_editor" | "partial_editor" | "facilitation_support">()
      .notNull(),
    token: text("token").notNull().unique(),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => users.id),
    status: text("status")
      .$type<"pending" | "accepted" | "cancelled" | "declined">()
      .notNull()
      .default("pending"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("facilitator_inv_training_idx").on(t.trainingId),
    index("facilitator_inv_email_idx").on(t.email),
  ],
);

// ─── TrainingParticipants ─────────────────────────────────────────────────────
export const trainingParticipants = pgTable(
  "training_participants",
  {
    trainingId: uuid("training_id")
      .notNull()
      .references(() => trainings.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
    connectionStatus: text("connection_status")
      .$type<"online" | "offline">()
      .notNull()
      .default("online"),
    lastHeartbeat: timestamp("last_heartbeat"),
    personalNotes: text("personal_notes").notNull().default(""),
    personalWhiteboard: jsonb("personal_whiteboard").$type<Record<string, unknown>>().notNull().default({}),
  },
  (t) => [
    primaryKey({ columns: [t.trainingId, t.userId] }),
    index("participants_training_idx").on(t.trainingId),
    index("participants_user_id_idx").on(t.userId),
  ],
);

// ─── LiveSessions ─────────────────────────────────────────────────────────────
export const liveSessions = pgTable(
  "live_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trainingId: uuid("training_id")
      .notNull()
      .references(() => trainings.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    endedAt: timestamp("ended_at"),
    status: text("status").$type<"active" | "completed">().notNull().default("active"),
    targetResponses: integer("target_responses"),
    createdBy: text("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("live_sessions_training_idx").on(t.trainingId),
    index("live_sessions_training_status_idx").on(t.trainingId, t.status),
  ],
);

// ─── LiveSessionModuleStats ───────────────────────────────────────────────────
export const liveSessionModuleStats = pgTable(
  "live_session_module_stats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    liveSessionId: uuid("live_session_id")
      .notNull()
      .references(() => liveSessions.id, { onDelete: "cascade" }),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => trainingModules.id, { onDelete: "cascade" }),
    accumulatedSeconds: integer("accumulated_seconds").notNull().default(0),
    isRunning: boolean("is_running").notNull().default(true),
    lastStartedAt: timestamp("last_started_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("module_stats_session_module_idx").on(t.liveSessionId, t.moduleId),
  ],
);

// ─── ParticipantResponses ─────────────────────────────────────────────────────
export const participantResponses = pgTable(
  "participant_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trainingId: uuid("training_id")
      .notNull()
      .references(() => trainings.id, { onDelete: "cascade" }),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => trainingModules.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    responseData: jsonb("response_data").$type<Record<string, unknown>>().notNull(),
    startedAt: timestamp("started_at"),
    timeSpentSeconds: integer("time_spent_seconds"),
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    liveSessionId: uuid("live_session_id").references(() => liveSessions.id, { onDelete: "set null" }),
  },
  (t) => [
    index("responses_training_module_idx").on(t.trainingId, t.moduleId),
    uniqueIndex("responses_user_unique_idx").on(t.trainingId, t.moduleId, t.userId),
    index("responses_session_module_idx").on(t.liveSessionId, t.moduleId),
    index("responses_user_id_idx").on(t.userId),
  ],
);

// ─── TrainingAnalytics ────────────────────────────────────────────────────────
export const trainingAnalytics = pgTable("training_analytics", {
  trainingId: uuid("training_id")
    .primaryKey()
    .references(() => trainings.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  aggregateData: jsonb("aggregate_data").$type<Record<string, unknown>>().notNull().default({}),
  exportUrl: text("export_url"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  workspaceMembers: many(workspaceMembers),
  ownedWorkspaces: many(workspaces),
  facilitatorRoles: many(trainingFacilitators),
  participantRoles: many(trainingParticipants),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, { fields: [workspaces.ownerId], references: [users.id] }),
  members: many(workspaceMembers),
  trainings: many(trainings),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, { fields: [workspaceMembers.userId], references: [users.id] }),
}));

export const trainingsRelations = relations(trainings, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [trainings.workspaceId],
    references: [workspaces.id],
  }),
  creator: one(users, { fields: [trainings.createdBy], references: [users.id] }),
  days: many(trainingDays),
  modules: many(trainingModules),
  facilitators: many(trainingFacilitators),
  pendingInvitations: many(trainingFacilitatorInvitations),
  participants: many(trainingParticipants),
  liveSessions: many(liveSessions),
  analytics: one(trainingAnalytics, {
    fields: [trainings.id],
    references: [trainingAnalytics.trainingId],
  }),
}));

export const liveSessionModuleStatsRelations = relations(liveSessionModuleStats, ({ one }) => ({
  liveSession: one(liveSessions, { fields: [liveSessionModuleStats.liveSessionId], references: [liveSessions.id] }),
  module: one(trainingModules, { fields: [liveSessionModuleStats.moduleId], references: [trainingModules.id] }),
}));

export const trainingDaysRelations = relations(trainingDays, ({ one, many }) => ({
  training: one(trainings, { fields: [trainingDays.trainingId], references: [trainings.id] }),
  modules: many(trainingModules),
}));

export const trainingModulesRelations = relations(trainingModules, ({ one, many }) => ({
  training: one(trainings, { fields: [trainingModules.trainingId], references: [trainings.id] }),
  day: one(trainingDays, { fields: [trainingModules.dayId], references: [trainingDays.id] }),
  responses: many(participantResponses),
}));

export const trainingFacilitatorsRelations = relations(trainingFacilitators, ({ one }) => ({
  training: one(trainings, {
    fields: [trainingFacilitators.trainingId],
    references: [trainings.id],
  }),
  user: one(users, { fields: [trainingFacilitators.userId], references: [users.id] }),
}));

export const trainingFacilitatorInvitationsRelations = relations(trainingFacilitatorInvitations, ({ one }) => ({
  training: one(trainings, { fields: [trainingFacilitatorInvitations.trainingId], references: [trainings.id] }),
  inviter: one(users, { fields: [trainingFacilitatorInvitations.invitedBy], references: [users.id] }),
}));

export const trainingParticipantsRelations = relations(trainingParticipants, ({ one }) => ({
  training: one(trainings, {
    fields: [trainingParticipants.trainingId],
    references: [trainings.id],
  }),
  user: one(users, { fields: [trainingParticipants.userId], references: [users.id] }),
}));

export const participantResponsesRelations = relations(participantResponses, ({ one }) => ({
  training: one(trainings, {
    fields: [participantResponses.trainingId],
    references: [trainings.id],
  }),
  module: one(trainingModules, {
    fields: [participantResponses.moduleId],
    references: [trainingModules.id],
  }),
  user: one(users, { fields: [participantResponses.userId], references: [users.id] }),
  liveSession: one(liveSessions, {
    fields: [participantResponses.liveSessionId],
    references: [liveSessions.id],
  }),
}));

export const liveSessionsRelations = relations(liveSessions, ({ one, many }) => ({
  training: one(trainings, { fields: [liveSessions.trainingId], references: [trainings.id] }),
  creator: one(users, { fields: [liveSessions.createdBy], references: [users.id] }),
  responses: many(participantResponses),
}));

// ─── Auth Tables ─────────────────────────────────────────────────────────────

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    token: text("token").notNull().unique(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("refresh_tokens_user_id_idx").on(t.userId)],
);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  token: text("token").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  token: text("token").notNull().unique(),
  code: text("code").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
