import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Access-gate helpers (Node runtime — used by proxy.ts and /api/auth).
 *
 * The cookie stores a non-reversible token derived from the shared secret, not
 * the secret itself, so a leaked cookie can't reveal APP_ACCESS_SECRET. Compares
 * are constant-time to avoid leaking length/match info via timing.
 */

/** Derive the cookie token from the shared secret (sha256 hex). */
export function accessToken(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
