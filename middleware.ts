import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware for security headers and basic protection
 * Runs on every request before reaching the route handlers
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers (also set in next.config.mjs, but belt and suspenders)
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy (formerly Feature Policy)
  response.headers.set(
    "Permissions-Policy",
    "camera=*, microphone=(), geolocation=(), payment=()"
  );

  return response;
}

/**
 * Configure which routes the middleware runs on
 * Run on all routes except static assets
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
