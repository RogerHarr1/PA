/**
 * Simple in-memory rate limiter
 * For production, consider Redis-based solution for multi-instance deployments
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

const MAX_REQUESTS =
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5', 10) || 5;
const WINDOW_MS =
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10) || 60000; // 1 minute

/**
 * Check if a request from the given identifier is allowed
 * @param identifier - Usually IP address
 * @returns true if allowed, false if rate limit exceeded
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const entry = store.get(identifier);

  // Clean up old entries periodically (simple cleanup on every check)
  if (Math.random() < 0.01) {
    // 1% chance
    cleanupExpiredEntries(now);
  }

  if (!entry || now > entry.resetTime) {
    // First request or window expired
    const resetTime = now + WINDOW_MS;
    store.set(identifier, {
      count: 1,
      resetTime,
    });

    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      resetTime,
    };
  }

  // Within the window
  if (entry.count >= MAX_REQUESTS) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        action: 'rate_limit_exceeded',
        identifier,
        count: entry.count,
        resetTime: new Date(entry.resetTime).toISOString(),
      })
    );

    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment counter
  entry.count += 1;
  store.set(identifier, entry);

  return {
    allowed: true,
    remaining: MAX_REQUESTS - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Remove expired entries from the store
 */
function cleanupExpiredEntries(now: number): void {
  let cleaned = 0;
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        action: 'rate_limit_cleanup',
        entriesRemoved: cleaned,
        remainingEntries: store.size,
      })
    );
  }
}

/**
 * Get the client identifier from the request
 * Prefers x-forwarded-for for proxy scenarios
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback - note: might be unreliable in some deployments
  return 'unknown';
}
