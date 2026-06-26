import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limiting for unauthenticated/abuse-prone endpoints (login, register,
// password reset). Backed by Upstash Redis so the limit is shared across all
// serverless instances (in-memory counters wouldn't be on Vercel).
//
// If the Upstash env vars are absent (e.g. local dev without an account), the
// limiters are null and `checkRateLimit` is a no-op so the app still works.

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

if (!redis && process.env.NODE_ENV === "production") {
  console.warn(
    "[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting is DISABLED."
  );
}

function make(limiter: ReturnType<typeof Ratelimit.slidingWindow>): Ratelimit | null {
  return redis ? new Ratelimit({ redis, limiter, prefix: "rl", analytics: false }) : null;
}

// Tunable windows. Sliding window = "N requests per duration", per key.
//
// Login uses two layers:
//  - loginLimiter: the user-facing limit, enforced by the /api/auth/login-precheck
//    endpoint the login page calls before submitting (so we can show a clear
//    "too many attempts" message NextAuth would otherwise mask).
//  - loginBackstopLimiter: a generous cap inside authorize() that only matters if
//    someone skips the UI and POSTs the NextAuth callback directly.
export const loginLimiter = make(Ratelimit.slidingWindow(8, "1 m"));
export const loginBackstopLimiter = make(Ratelimit.slidingWindow(20, "1 m"));
export const registerLimiter = make(Ratelimit.slidingWindow(5, "1 h"));
export const forgotPasswordLimiter = make(Ratelimit.slidingWindow(4, "1 h"));

// Per-user daily cap on ATS analyses (bounds OpenAI cost; key by userId).
export const atsLimiter = make(Ratelimit.slidingWindow(25, "1 d"));

export interface RateLimitResult {
  success: boolean;
  /** Seconds until the caller may retry (only meaningful when blocked). */
  retryAfter: number;
}

export async function checkRateLimit(
  limiter: Ratelimit | null,
  key: string
): Promise<RateLimitResult> {
  if (!limiter) return { success: true, retryAfter: 0 };
  const { success, reset } = await limiter.limit(key);
  const retryAfter = success ? 0 : Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return { success, retryAfter };
}

/**
 * Best-effort client IP from proxy headers. On Vercel the real client is the
 * first entry of `x-forwarded-for`. Falls back to a constant so local dev (no
 * proxy headers) still works — all local callers share one bucket, which is
 * fine since Upstash is usually unconfigured locally anyway.
 */
export function getClientIp(headers: { get(name: string): string | null }): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip") || "127.0.0.1";
}
