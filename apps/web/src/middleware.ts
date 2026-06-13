import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware runs on the edge — it cannot access localStorage.
// Auth protection is handled client-side by AuthGuard + useAuth.
// This middleware only handles simple redirects that don't need token checks.

export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
