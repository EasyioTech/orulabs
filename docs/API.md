# REST API Reference

Base URL: `http://localhost:3001`

All authenticated endpoints require a valid JWT in one of:
- `Authorization: Bearer <token>` header
- `x-auth-token: <token>` header
- `token` HTTP-only cookie (set by `/api/auth/token`)

Workspace-scoped endpoints require `X-Workspace-ID: <workspaceId>` header.

---

## Auth

### `GET /api/auth/signin/google`
Redirects to Google OAuth.

### `GET /api/auth/callback/google`
OAuth callback. Exchanges code for session, then redirect to frontend.

### `POST /api/auth/token`
Exchange Better Auth session for JWT cookie.

### `POST /api/auth/logout`
Clears JWT cookie.

---

## Workspaces

### `GET /api/workspaces`
List workspaces for authenticated user.

### `POST /api/workspaces`
```json
{ "name": "string" }
```

### `GET /api/workspaces/:workspaceId`
Workspace with members.

### `PATCH /api/workspaces/:workspaceId`
```json
{ "name": "string" }
```
Owner only.

### `DELETE /api/workspaces/:workspaceId`
Owner only.

### `POST /api/workspaces/:workspaceId/members`
```json
{ "userId": "string", "role": "owner | member" }
```

---

## Trainings

All routes: `X-Workspace-ID` required.

### `GET /api/workspaces/:workspaceId/trainings`
### `POST /api/workspaces/:workspaceId/trainings`
```json
{ "title": "string", "category": "string", "description?": "string", "scheduledAt?": "ISO date" }
```
### `GET /api/workspaces/:workspaceId/trainings/:id`
With modules, facilitators, participants.
### `PATCH /api/workspaces/:workspaceId/trainings/:id`
Requires `edit_agenda` permission.
### `DELETE /api/workspaces/:workspaceId/trainings/:id`
### `POST /api/workspaces/:workspaceId/trainings/:id/facilitators`
```json
{ "userId": "string", "role": "lead_trainer | full_editor | partial_editor | facilitation_support", "assignedModules": [] }
```
### `PATCH /api/workspaces/:workspaceId/trainings/:id/status`
```json
{ "status": "draft | live | completed" }
```

---

## Modules

### `GET /api/workspaces/:workspaceId/trainings/:trainingId/modules`
### `POST /api/workspaces/:workspaceId/trainings/:trainingId/modules`
```json
{ "title": "string", "moduleType": "quiz|whiteboard|reflection|matrix|custom", "position": 0 }
```
### `PATCH /api/workspaces/:workspaceId/trainings/:trainingId/modules/:moduleId`
### `DELETE /api/workspaces/:workspaceId/trainings/:trainingId/modules/:moduleId`
### `POST /api/workspaces/:workspaceId/trainings/:trainingId/modules/:moduleId/unlock`
Requires `unlock_modules` permission.
### `POST /api/workspaces/:workspaceId/trainings/:trainingId/modules/reorder`
```json
{ "order": [{ "id": "string", "position": 0 }] }
```

---

## Responses

### `POST /api/workspaces/:workspaceId/trainings/:trainingId/modules/:moduleId/responses`
```json
{ "responseData": {} }
```
Upserts — one response per user per module.

### `GET /api/workspaces/:workspaceId/trainings/:trainingId/modules/:moduleId/responses`
All responses with user data (trainer only).

---

## Participants

### `GET /api/:trainingId/participants`
### `POST /api/join/:joinToken`
Public join endpoint. Upserts participant, requires session to be `live`.
### `POST /api/:trainingId/participants/heartbeat`

---

## Analytics

### `GET /api/workspaces/:workspaceId/trainings/:trainingId/analytics`
Requires `view_data` permission.
### `POST /api/workspaces/:workspaceId/trainings/:trainingId/analytics/export`
Requires `export_data` permission. Returns `{ jobId, status }`.

---

## Health

### `GET /health`
```json
{ "status": "ok", "ts": 1700000000000 }
```
