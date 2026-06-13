// Centralized tunables. Keep numbers here, not strewn through route files,
// so an operator can adjust limits without grepping the codebase.

// HTTP rate limits
export const SUBMIT_RATE_MAX = 10;
export const SUBMIT_RATE_WINDOW_MS = 1_000;

// Pagination caps
export const MODULES_PAGE_MAX = 200;
export const RESPONSES_PAGE_MAX = 500;

// In-process caches
export const ROLE_CACHE_TTL_MS = 60_000;
export const USER_NAME_CACHE_TTL_MS = 60_000;
export const USER_NAME_CACHE_MAX = 500;

// Socket state persistence
export const SOCKET_STATE_REDIS_TTL_S = 60 * 60 * 24;

// Sessions
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 7;
