export interface SessionStatusConfig {
  label: string;
  dot: string;
  pill: string;
}

const STATUS_CONFIG: Record<string, SessionStatusConfig> = {
  live: { label: "Live", dot: "bg-green-500", pill: "bg-green-50 text-green-700 border-green-200" },
  connecting: { label: "Open", dot: "bg-blue-500", pill: "bg-blue-50 text-blue-700 border-blue-200" },
  paused: { label: "Paused", dot: "bg-amber-500", pill: "bg-amber-50 text-amber-700 border-amber-200" },
  draft: { label: "Draft", dot: "bg-gray-400", pill: "bg-gray-50 text-gray-500 border-gray-100" },
  completed: { label: "Ended", dot: "bg-gray-400", pill: "bg-gray-50 text-gray-500 border-gray-100" },
};

/** Pill styling for a session status, falling back to a neutral grey badge. */
export function sessionStatusConfig(status: string): SessionStatusConfig {
  return STATUS_CONFIG[status] ?? { label: status, dot: "bg-gray-400", pill: "bg-gray-50 text-gray-500 border-gray-100" };
}
