import { z } from "zod";


export const TrainingTypeSchema = z.enum(["in_person", "online", "hybrid"]);
export const ModuleTypeSchema = z.enum(["quiz", "whiteboard", "reflection", "matrix", "custom", "attendance", "poll", "wordcloud", "qna", "timer", "pulse", "mapping", "form", "embed"]);
export const TrainingRoleSchema = z.enum([
  "lead_trainer",
  "full_editor",
  "partial_editor",
  "facilitation_support",
]);

const TrainingFields = {
  title: z.string().min(3).max(200),
  labels: z.preprocess(
    (v) => (typeof v === "string" ? v.split(",").map(s => s.trim()).filter(Boolean) : v),
    z.array(z.string()).default([])
  ),
  type: TrainingTypeSchema.default("in_person"),
  description: z.string().max(1000).optional(),
  venue: z.preprocess((v) => (v === "" ? undefined : v), z.string().max(500).optional()),
  meetingLink: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().max(1000).optional()),
  startDate: z.preprocess(
    (v) => (v === "" || v == null ? undefined : typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00.000Z` : v),
    z.string().datetime({ offset: true }).optional(),
  ),
  endDate: z.preprocess(
    (v) => (v === "" || v == null ? undefined : typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00.000Z` : v),
    z.string().datetime({ offset: true }).optional(),
  ),
  checklist: z
    .array(z.object({ id: z.string().max(64), label: z.string().min(1).max(200), done: z.boolean() }))
    .max(50)
    .optional(),
} as const;

// A range is only valid when end is on/after start; either side may be absent.
const endOnOrAfterStart = (d: { startDate?: string; endDate?: string }) =>
  !d.startDate || !d.endDate || new Date(d.endDate) >= new Date(d.startDate);
const rangeError = { message: "End date must be on or after the start date", path: ["endDate"] };

export const CreateTrainingSchema = z.object(TrainingFields).refine(endOnOrAfterStart, rangeError);

export const UpdateTrainingSchema = z.object(TrainingFields).partial().refine(endOnOrAfterStart, rangeError);

export const CreateDaySchema = z.object({
  dayNumber: z.number().int().min(1),
  title: z.string().min(1).max(200),
  date: z.preprocess(
    (v) => (v === "" || v == null ? undefined : typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00.000Z` : v),
    z.string().datetime({ offset: true }).optional(),
  ),
  description: z.string().max(1000).optional(),
  deliveryMode: z.enum(["in_person", "online", "hybrid"]).optional(),
});

export const UpdateDaySchema = CreateDaySchema.partial();

export const ReorderDaysSchema = z.object({
  order: z.array(z.object({ id: z.string().uuid(), dayNumber: z.number().int().min(1) })),
});

export const ReorderModulesSchema = z.object({
  order: z
    .array(z.object({ id: z.string().uuid(), position: z.number().int().min(0) }))
    .min(1)
    .max(500),
});

export const CreateModuleSchema = z.object({
  title: z.string().min(1).max(200),
  moduleType: ModuleTypeSchema,
  position: z.number().int().min(0),
  dayId: z.string().uuid().nullable().optional(),
  isAlwaysOn: z.boolean().default(false),
  config: z.record(z.unknown()).default({}),
});

export const UpdateModuleSchema = CreateModuleSchema.partial();

export const UnlockModuleSchema = z.object({
  moduleId: z.string().uuid(),
});

// Whiteboard stroke payload — caps point count and numeric range so a
// misbehaving client can't pump arbitrarily large payloads to the room.
export const StrokeSchema = z.object({
  id: z.string().max(64),
  color: z.string().max(32),
  width: z.number().finite().min(0).max(64),
  points: z
    .array(z.object({ x: z.number().finite().min(-10_000).max(10_000), y: z.number().finite().min(-10_000).max(10_000) }))
    .min(1)
    .max(2_000),
});

export const DrawUpdateSchema = z.object({
  trainingId: z.string().uuid(),
  moduleId: z.string().uuid(),
  stroke: StrokeSchema,
});

export const DrawClearSchema = z.object({
  trainingId: z.string().uuid(),
  moduleId: z.string().uuid(),
});

export const DrawSyncSchema = z.object({
  trainingId: z.string().uuid(),
  moduleId: z.string().uuid(),
  strokes: z.array(StrokeSchema).max(5_000),
});

export const StickyNoteSchema = z.object({
  id: z.string().max(64),
  text: z.string().max(10_000),
  color: z.string().max(32).optional(),
  authorId: z.string().max(128).optional(),
  authorName: z.string().max(256).optional(),
  x: z.number().finite().min(-100_000).max(100_000),
  y: z.number().finite().min(-100_000).max(100_000),
});

export const NoteCreateSchema = z.object({
  trainingId: z.string().uuid(),
  moduleId: z.string().uuid(),
  note: StickyNoteSchema,
});

export const NotePositionSchema = z.object({
  trainingId: z.string().uuid(),
  moduleId: z.string().uuid(),
  noteId: z.string().max(64),
  x: z.number().finite().min(-100_000).max(100_000),
  y: z.number().finite().min(-100_000).max(100_000),
});

export const TimerSyncSchema = z.object({
  trainingId: z.string().uuid(),
  moduleId: z.string().uuid(),
  remaining: z.number().finite().min(0).max(86_400),
  running: z.boolean(),
  duration: z.number().finite().min(0).max(86_400),
});

// Socket payloads for the DB-writing live handlers. Client-sent, so validated
// before any insert/upsert — rejects malformed trainingId/moduleId early with a
// clear BAD_PAYLOAD instead of letting bad data reach a FK/insert error.
export const ParticipantJoinSchema = z.object({
  trainingId: z.string().uuid(),
  role: z.enum(["trainer", "participant"]),
});

export const ModuleUnlockSchema = z.object({
  trainingId: z.string().uuid(),
  moduleId: z.string().uuid(),
});

export const ResponseSubmitSchema = z.object({
  trainingId: z.string().uuid(),
  moduleId: z.string().uuid(),
  responseData: z.record(z.unknown()),
});

export const StopwatchActionSchema = z.object({
  trainingId: z.string().uuid(),
  moduleId: z.string().uuid(),
  action: z.enum(["pause", "resume", "reset"]),
});

export const ModuleSetTimeLimitSchema = z.object({
  trainingId: z.string().uuid(),
  moduleId: z.string().uuid(),
  timeLimitSeconds: z.number().int().min(0).max(86_400),
});

export const ScratchpadUpdateSchema = z
  .object({
    personalNotes: z.string().max(50_000).optional(),
    personalWhiteboard: z.record(z.unknown()).optional(),
  })
  .refine((v) => v.personalNotes !== undefined || v.personalWhiteboard !== undefined, {
    message: "At least one of personalNotes or personalWhiteboard is required",
  });

export const JoinCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});

export const FacilitatorInviteSchema = z.object({
  email: z.string().email(),
  role: TrainingRoleSchema,
});

export const SessionStatusSchema = z.object({
  status: z.enum(["draft", "connecting", "live", "paused", "completed"]),
});

export const AssignModuleToDaySchema = z.object({
  moduleId: z.string().uuid(),
});

export const DuplicateModuleSchema = z.object({
  targetTrainingId: z.string().uuid().optional(),
  targetDayId: z.string().uuid().nullable().optional(),
});

export const AssignFacilitatorSchema = z.object({
  userId: z.string(),
  role: TrainingRoleSchema,
  assignedModules: z.array(z.string().uuid()).default([]),
});

export type CreateTrainingInput = z.infer<typeof CreateTrainingSchema>;
export type UpdateTrainingInput = z.infer<typeof UpdateTrainingSchema>;
export type CreateDayInput = z.infer<typeof CreateDaySchema>;
export type UpdateDayInput = z.infer<typeof UpdateDaySchema>;
export type ReorderDaysInput = z.infer<typeof ReorderDaysSchema>;
export type ReorderModulesInput = z.infer<typeof ReorderModulesSchema>;
export type CreateModuleInput = z.infer<typeof CreateModuleSchema>;
export type UpdateModuleInput = z.infer<typeof UpdateModuleSchema>;
export type UnlockModuleInput = z.infer<typeof UnlockModuleSchema>;
export type AssignFacilitatorInput = z.infer<typeof AssignFacilitatorSchema>;
export type ScratchpadUpdateInput = z.infer<typeof ScratchpadUpdateSchema>;
export type JoinCodeInput = z.infer<typeof JoinCodeSchema>;
export type FacilitatorInviteInput = z.infer<typeof FacilitatorInviteSchema>;
export type SessionStatusInput = z.infer<typeof SessionStatusSchema>;
export type AssignModuleToDayInput = z.infer<typeof AssignModuleToDaySchema>;
export type DuplicateModuleInput = z.infer<typeof DuplicateModuleSchema>;
export type StrokeInput = z.infer<typeof StrokeSchema>;
export type DrawUpdateInput = z.infer<typeof DrawUpdateSchema>;
export type DrawClearInput = z.infer<typeof DrawClearSchema>;
export type DrawSyncInput = z.infer<typeof DrawSyncSchema>;
export type StickyNoteInput = z.infer<typeof StickyNoteSchema>;
export type NoteCreateInput = z.infer<typeof NoteCreateSchema>;
export type NotePositionInput = z.infer<typeof NotePositionSchema>;
export type TimerSyncInput = z.infer<typeof TimerSyncSchema>;
export type StopwatchActionInput = z.infer<typeof StopwatchActionSchema>;
export type ModuleSetTimeLimitInput = z.infer<typeof ModuleSetTimeLimitSchema>;
