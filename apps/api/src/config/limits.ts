// Centralized tunables. Keep numbers here, not strewn through route files,
// so an operator can adjust limits without grepping the codebase.

// HTTP rate limits
export const SUBMIT_RATE_MAX = 10;
export const SUBMIT_RATE_WINDOW_MS = 1_000;

// In-process caches
export const ROLE_CACHE_TTL_MS = 60_000;
export const USER_NAME_CACHE_TTL_MS = 60_000;
export const USER_NAME_CACHE_MAX = 500;

// Min interval between persisted heartbeat writes per socket. Well under the 20s
// Socket.IO pingTimeout used for disconnect detection.
export const HEARTBEAT_WRITE_MS = 15_000;
