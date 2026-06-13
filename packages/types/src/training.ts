export type TrainingStatus = "draft" | "connecting" | "live" | "paused" | "completed";
export type TrainingCategory = "atl" | "maker_space" | "ict_cal";
export type ModuleType = "quiz" | "whiteboard" | "reflection" | "matrix" | "custom" | "attendance" | "poll" | "wordcloud" | "qna" | "timer" | "pulse" | "mapping" | "form" | "embed";
export type TrainingRole =
  | "lead_trainer"
  | "full_editor"
  | "partial_editor"
  | "facilitation_support";
export type ConnectionStatus = "online" | "offline";

export interface Training {
  id: string;
  workspaceId: string;
  title: string;
  labels?: string[];
  type?: string;
  description: string | null;
  venue?: string;
  meetingLink?: string;
  startDate?: string;
  endDate?: string;
  currentActiveModuleId: string | null;
  sessionStatus: TrainingStatus;
  joinToken: string;
  checklist?: { id: string; label: string; done: boolean }[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  facilitators?: Array<{ userId: string; role: TrainingRole }>;
  pendingInvitations?: TrainingFacilitatorInvitation[];
  modules?: TrainingModule[];
  days?: TrainingDay[];
}

export interface TrainingDay {
  id: string;
  trainingId: string;
  dayNumber: number;
  title: string;
  date: Date | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  deliveryMode?: "in_person" | "online" | "hybrid";
  modules?: TrainingModule[];
}

export interface TrainingModule {
  id: string;
  trainingId: string;
  dayId: string | null;
  title: string;
  moduleType: ModuleType;
  position: number;
  isUnlocked: boolean;
  isAlwaysOn: boolean;
  config: ModuleConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceField {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "select";
  options?: string[]; // for select type
  required: boolean;
}

export type FormFieldType = "short_text" | "long_text" | "multiple_choice" | "checkboxes" | "dropdown" | "date" | "time";

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  options?: string[];
  description?: string;
}

export interface ModuleConfig {
  // Quiz
  questions?: QuizQuestion[];
  // Whiteboard
  canvasWidth?: number;
  canvasHeight?: number;
  // Matrix
  rows?: string[];
  columns?: string[];
  // Reflection
  prompt?: string;
  maxLength?: number;
  // Sticky notes
  backgroundColor?: string;
  // Attendance
  attendanceFields?: AttendanceField[];
  // Poll
  pollQuestion?: string;
  pollOptions?: string[];
  allowMultiple?: boolean;
  // Word Cloud
  wordcloudPrompt?: string;
  maxWords?: number;
  // Q&A
  qnaPrompt?: string;
  allowUpvote?: boolean;
  // Timer
  durationSeconds?: number;
  timerLabel?: string;
  // Pulse
  pulsePrompt?: string;
  pulseEmojis?: string[];
  isAnonymous?: boolean;
  // Mapping
  mappingFocusAreas?: { id: string; title: string; numFields: number }[];
  // Form
  formTitle?: string;
  formDescription?: string;
  formFields?: FormField[];
  // Time limit for interactive modules
  timeLimitSeconds?: number;
  // Embed
  embeds?: { id: string; url: string; title?: string; description?: string; type?: string }[];
  // Legacy single-embed fields (pre-multi-embed migration); read as fallback.
  embedUrl?: string;
  embedTitle?: string;
  embedDescription?: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: "multiple_choice" | "short_answer" | "true_false" | "metric_rating";
  options?: string[];
  correctAnswer?: string;
  minVal?: number;
  maxVal?: number;
}

export interface TrainingFacilitator {
  trainingId: string;
  userId: string;
  role: TrainingRole;
  assignedModules: string[];
}

export interface TrainingFacilitatorInvitation {
  id: string;
  trainingId: string;
  email: string;
  role: TrainingRole;
  status: "pending" | "accepted" | "cancelled";
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

export interface TrainingParticipant {
  trainingId: string;
  userId: string;
  joinedAt: Date;
  connectionStatus: ConnectionStatus;
  lastHeartbeat: Date | null;
}

export interface ParticipantResponse {
  id: string;
  trainingId: string;
  moduleId: string;
  userId: string;
  responseData: ResponseData;
  submittedAt: Date;
  createdAt?: Date;
}

export interface ParticipantResponseWithUser extends ParticipantResponse {
  user: { id: string; name: string; email: string } | null;
}

export interface LiveSession {
  id: string;
  trainingId: string;
  startedAt: Date;
  endedAt: Date | null;
  status: "active" | "completed";
  targetResponses: number | null;
  createdBy: string;
  createdAt: Date;
}

export interface SessionStats {
  sessionId: string;
  submitted: number;
  totalParticipants: number;
  completionPct: number;
  targetResponses: number | null;
}

export interface SubmissionEntry {
  userId: string;
  name: string;
  avatarUrl: string | null;
  hasSubmitted: boolean;
  submittedAt: string | null;
  responseId: string | null;
}

export type ResponseData =
  | { type: "quiz"; answers: Record<string, string> }
  | { type: "whiteboard"; strokes: StrokeData[] }
  | { type: "reflection"; text: string; comments?: ReflectionComment[] }
  | { type: "matrix"; cells: Record<string, string> }
  | { type: "sticky"; notes: StickyNote[] }
  | { type: "attendance"; fields: Record<string, string> }
  | { type: "poll"; selected: string[] }
  | { type: "wordcloud"; words: string[] }
  | { type: "qna"; question: string }
  | { type: "pulse"; emoji: string }
  | { type: "mapping"; answers: Record<string, string[]> }
  | { type: "form"; answers: Record<string, string | string[]> }
  | { type: "embed"; viewed: boolean };

/**
 * Narrow a stored ResponseData to a specific module type. Returns undefined when
 * the discriminant doesn't match (or data is absent), so callers fall back to
 * defaults instead of reaching through `as any`.
 */
export function responseDataOf<T extends ResponseData["type"]>(
  data: ResponseData | null | undefined,
  type: T,
): Extract<ResponseData, { type: T }> | undefined {
  return data?.type === type ? (data as Extract<ResponseData, { type: T }>) : undefined;
}

export interface StrokeData {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  tool?: "pen" | "eraser" | "highlighter" | "line" | "arrow" | "square";
}

export interface ReflectionComment {
  id: string;
  text: string;
  trainerName: string;
  createdAt: string;
}

export interface StickyNote {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
}

export interface TrainingAnalytics {
  trainingId: string;
  workspaceId: string;
  aggregateData: Record<string, unknown>;
  exportUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceEntry {
  userId: string;
  joinedAt: string;
  leftAt: string | null;
}

export interface QuizAggregate {
  questionId: string;
  totalResponses: number;
  distribution: Record<string, number>;
}
