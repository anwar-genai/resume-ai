import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { checkRateLimit, getClientIp, loginLimiter } from "@/lib/ratelimit";

// The login page calls this before submitting credentials. It returns a clear
// 429 when the per-IP login rate is exceeded — NextAuth itself masks every
// credentials error as "CredentialsSignin", so this is how we show the user a
// real "too many attempts" message. Actual enforcement is also backstopped
// inside authorize() (see lib/auth.ts).
export async function POST() {
  const ip = getClientIp(await headers());
  const rl = await checkRateLimit(loginLimiter, `login:${ip}`);

  if (!rl.success) {
    return NextResponse.json(
      {
        error: `Too many login attempts. Please wait ${rl.retryAfter}s and try again.`,
        retryAfter: rl.retryAfter,
      },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  return NextResponse.json({ ok: true });
}
