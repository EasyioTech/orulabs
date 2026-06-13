import type { TrainingModule, StickyNote, StrokeData, ConnectionStatus, TrainingRole } from "./training";

// Client → Server events
export interface ClientToServerEvents {
  "participant:join": (data: { trainingId: string; role?: string }) => void;
  "module:unlock": (data: { trainingId: string; moduleId: string }) => void;
  "response:submit": (
    data: { trainingId: string; moduleId: string; responseData: unknown },
    ack?: (result: { ok: boolean; error?: string }) => void
  ) => void;
  "draw:update": (data: { trainingId: string; moduleId: string; stroke: StrokeData }) => void;
  "draw:clear": (data: { trainingId: string; moduleId: string }) => void;
  "draw:sync": (data: { trainingId: string; moduleId: string; strokes: StrokeData[] }) => void;
  "note:create": (data: { trainingId: string; moduleId: string; note: StickyNote }) => void;
  "note:position": (data: { trainingId: string; moduleId: string; noteId: string; x: number; y: number }) => void;
  "timer:sync": (data: { trainingId: string; moduleId: string; remaining: number; running: boolean; duration: number }) => void;
  "stopwatch:action": (data: { trainingId: string; moduleId: string; action: "pause" | "resume" | "reset" }) => void;
  "module:setTimeLimit": (data: { trainingId: string; moduleId: string; timeLimitSeconds: number }) => void;
  heartbeat: () => void;
}

// Server → Client events
export interface ServerToClientEvents {
  "module:unlocked": (data: { moduleId: string | null; module: TrainingModule | null }) => void;
  "participant:joined": (data: { userId: string; name: string; role: string; trainingRole?: TrainingRole | null; joinedAt: string; connectionStatus: ConnectionStatus }) => void;
  "participant:left": (data: { userId: string }) => void;
  "data:aggregate": (data: { trainingId: string; moduleId: string; responseCount: number }) => void;
  "session:submission_update": (data: { trainingId: string; moduleId: string; liveSessionId: string; submitted: number; totalParticipants: number }) => void;
  "draw:update": (data: { moduleId: string; userId: string; stroke: StrokeData }) => void;
  "draw:clear": (data: { moduleId: string; userId: string }) => void;
  "draw:sync": (data: { moduleId: string; userId: string; strokes: StrokeData[] }) => void;
  "note:create": (data: { moduleId: string; note: StickyNote }) => void;
  "note:position": (data: { moduleId: string; noteId: string; x: number; y: number }) => void;
  "timer:sync": (data: { moduleId: string; remaining: number; running: boolean; duration: number }) => void;
  "stopwatch:sync": (data: { moduleId: string; accumulatedSeconds: number; isRunning: boolean; lastStartedAt: string }) => void;
  "session:paused": () => void;
  "session:resumed": () => void;
  "session:started": () => void;
  "session:ended": () => void;
  "session:reset": () => void;
  error: (data: { code: string; message: string }) => void;
}

// Socket.IO inter-server events (for adapter)
export interface InterServerEvents {
  ping: () => void;
}

// Socket data attached per connection
export interface SocketData {
  userId: string;
  userEmail: string;
  trainingId: string;
  role: "trainer" | "participant";
  // The facilitator's granular role (lead_trainer | full_editor | partial_editor |
  // facilitation_support) when role === "trainer". null/undefined for participants.
  trainingRole?: TrainingRole | null;
}
