import crypto from "crypto";

export const MIN_PASSWORD_LENGTH = 8;

/**
 * Check a password against HaveIBeenPwned using k-anonymity: only the first 5
 * chars of the SHA-1 are sent, never the password. Fails OPEN (returns false)
 * on any network/error so a HIBP outage can't block sign-ups.
 */
async function isPwnedPassword(password: string): Promise<boolean> {
  try {
    const sha1 = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
    });
    if (!res.ok) return false;

    const body = await res.text();
    return body
      .split("\n")
      .some((line) => line.split(":")[0]?.trim().toUpperCase() === suffix);
  } catch {
    return false;
  }
}

export type PasswordCheck = { ok: true } | { ok: false; error: string };

/** Enforce the minimum length, then reject known-breached passwords. */
export async function validatePassword(password: string): Promise<PasswordCheck> {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (await isPwnedPassword(password)) {
    return {
      ok: false,
      error: "This password has appeared in a known data breach. Please choose a different one.",
    };
  }
  return { ok: true };
}
