# Architecture

## Overview

OruLabs is a real-time live training platform built as a Turborepo monorepo.

```
apps/api     — Hono.js HTTP + Socket.IO WebSocket server (port 3001)
apps/web     — Next.js 15 frontend (port 3000)
packages/
  types      — Shared TypeScript interfaces (no runtime deps)
  validators — Shared Zod schemas
  utils      — cn, dateFormat, permissions helpers
```

## Data Flow

```
Browser ──HTTP──► Next.js (proxy /api/*) ──► Hono API ──► PostgreSQL
Browser ──WS────────────────────────────────────────────► Socket.IO
                                                              │
                                                         Redis (Phase 3+)
```

## Backend: Dual-Server Pattern

Hono handles HTTP routing; Socket.IO requires raw Node.js `http.Server`. Both share port 3001:

```typescript
const httpServer = createServer((req, res) => app.fetch(...));
const io = new SocketIOServer(httpServer, { cors: {...} });
httpServer.listen(3001);
```

## Tenant Isolation

`workspace.ts` middleware runs before ALL routes. It reads `X-Workspace-ID` header, verifies `workspaceMembers` row, then attaches `workspaceId` + `workspaceRole` to the Hono context. Downstream handlers call `c.get("workspaceId")` — never derive it themselves.

## Role Permissions

```
lead_trainer      → unlock_modules, edit_agenda, pause_room, export_data, assign_roles, view_data, invite_participants
full_editor       → edit_agenda, view_data, invite_participants
partial_editor    → view_assigned_modules, view_data
facilitation_support → pause_room, view_data
```

`requireTrainingPermission(permission)` HOF enforces at route level.

## Database Schema (9 tables)

```
users → workspaceMembers → workspaces
                         ↓
            trainings ← trainingFacilitators
                ↓
         trainingModules
                ↓
    trainingParticipants   participantResponses
                               ↓
                       trainingAnalytics
```

## Real-Time State

Phase 1-2: In-memory `Map<trainingId, TrainingLiveState>` in `socket/state.ts`.
Phase 3+: Replace with `@socket.io/redis-adapter` for horizontal scaling.

## Dynamic Module Renderer

```typescript
const moduleComponentMap = {
  quiz: QuizRenderer,
  whiteboard: WhiteboardCanvas,
  reflection: ReflectionJournal,
  matrix: MatrixEditor,
  custom: StickyNotePad,
};
```

New module types require only a new component + map entry.
