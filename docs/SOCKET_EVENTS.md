# Socket.IO Event Catalog

All events use the root namespace (`/`). Clients join room `training:{trainingId}` on connect.

## Client → Server

### `participant:join`
```typescript
{ trainingId: string; userId: string; role: "trainer" | "participant" }
```
Joins the training room, updates DB `connectionStatus = "online"`, broadcasts `participant:joined` to room.

### `module:unlock`
```typescript
{ trainingId: string; moduleId: string }
```
Sets module `isUnlocked = true`, updates `training.currentActiveModuleId`, broadcasts `module:unlocked` to all.

### `response:submit`
```typescript
{ trainingId: string; moduleId: string; responseData: Record<string, unknown> }
```
Broadcasts `data:aggregate` to trainer for live result updates.

### `draw:update`
```typescript
{ trainingId: string; stroke: StrokeData }
```
Relays whiteboard stroke to all other participants in room.

### `note:create`
```typescript
{ trainingId: string; note: StickyNote }
```
Broadcasts new sticky note to all participants.

### `note:position`
```typescript
{ trainingId: string; noteId: string; x: number; y: number }
```
Broadcasts note drag position to all participants.

### `heartbeat`
```typescript
{ trainingId: string; userId: string }
```
Updates `lastHeartbeat` timestamp in DB.

## Server → Client

### `module:unlocked`
```typescript
{ moduleId: string; unlockedAt: string }
```

### `participant:joined`
```typescript
{ userId: string; name: string; role: "trainer" | "participant"; joinedAt: string }
```

### `participant:left`
```typescript
{ userId: string }
```

### `data:aggregate`
```typescript
{ moduleId: string; aggregate: Record<string, unknown> }
```

### `draw:update`
```typescript
{ stroke: StrokeData }
```

### `note:create`
```typescript
{ note: StickyNote }
```

### `note:position`
```typescript
{ noteId: string; x: number; y: number }
```

### `session:paused`
`{}` — trainer paused the session.

### `session:resumed`
`{}` — trainer resumed the session.

### `session:ended`
`{}` — session completed; clients should redirect.

### `error`
```typescript
{ message: string }
```
