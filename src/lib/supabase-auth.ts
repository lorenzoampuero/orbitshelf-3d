import "server-only";
import type { SupabaseConfig } from "@/lib/env";

/**
 * Minimal Supabase Auth (GoTrue) client over REST: only the two calls the magic-link flow needs.
 * Supabase proves the email address; the app then issues its own signed session cookie.
 */
export type Deps = { fetch?: typeof fetch };

export type MagicLinkResult = "sent" | "rate_limited" | "error";

export async function sendMagicLink(cfg: SupabaseConfig, email: string, redirectTo: string, deps?: Deps): Promise<MagicLinkResult> {
  const f = deps?.fetch ?? fetch;
  try {
    const res = await f(`${cfg.url}/auth/v1/otp?redirect_to=${encodeURIComponent(redirectTo)}`, {
      method: "POST",
      headers: { apikey: cfg.publishableKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, create_user: true }),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
      redirect: "error",
    });
    if (res.ok) return "sent";
    console.error("[auth] magic link request failed: HTTP", res.status);
    return res.status === 429 ? "rate_limited" : "error";
  } catch (e) {
    const cause = e instanceof Error && e.cause instanceof Error ? ` (${e.cause.message})` : "";
    console.error("[auth] magic link request failed:", e instanceof Error ? `${e.name}: ${e.message}${cause}` : "unknown");
    return "error";
  }
}

export type VerifiedUser = { id: string; email: string };

/** Asks Supabase who owns an access token. Returns null for any invalid, expired or unconfirmed token. */
export async function userFromAccessToken(cfg: SupabaseConfig, accessToken: string, deps?: Deps): Promise<VerifiedUser | null> {
  const f = deps?.fetch ?? fetch;
  try {
    const res = await f(`${cfg.url}/auth/v1/user`, {
      headers: { apikey: cfg.publishableKey, Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
      redirect: "error",
    });
    if (!res.ok) return null;
    const u = (await res.json()) as { id?: unknown; email?: unknown; email_confirmed_at?: unknown };
    if (typeof u.id !== "string" || typeof u.email !== "string" || !u.email_confirmed_at) return null;
    return { id: u.id, email: u.email.trim().toLowerCase() };
  } catch {
    return null;
  }
}
