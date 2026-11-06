import { apiError, apiJson, clientIp, readJsonCapped, sameOrigin } from "@/lib/api";
import { startSession } from "@/lib/auth-session";
import { brand } from "@/config/brand";
import { isLocale } from "@/i18n/config";
import { authMode, supabaseConfig } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { fieldErrors, loginSchema } from "@/lib/schemas";
import { sendMagicLink } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

/**
 * Sign-in entry point.
 * - Supabase configured: emails a magic link; the session starts in /api/auth/callback once the link is opened.
 * - Otherwise, LOCAL DEVELOPMENT SIGN-IN: no password, anyone who can reach this server can open any workspace by
 *   typing an email. It is disabled in production unless ALLOW_LOCAL_AUTH=true.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return apiError(403, "bad_origin", "Cross-site requests are not allowed.");
  const mode = authMode();
  if (mode === "disabled") return apiError(403, "auth_disabled", "Sign-in is not configured on this server.");
  const rl = await rateLimit(`login:${clientIp(req)}`, 20, 60_000);
  if (!rl.ok) return apiError(429, "rate_limited", "Too many sign-in attempts.", undefined, { "Retry-After": String(rl.retryAfterSeconds) });
  const read = await readJsonCapped(req, 2048);
  if (!read.ok) return read.response;
  const parsed = loginSchema.safeParse(read.value);
  if (!parsed.success) return apiError(422, "validation", "Enter a valid email address.", { fields: fieldErrors(parsed.error) });
  const perEmail = await rateLimit(`login-email:${parsed.data.email}`, mode === "supabase" ? 3 : 10, 10 * 60_000);
  if (!perEmail.ok) return apiError(429, "rate_limited", "Too many sign-in attempts.", undefined, { "Retry-After": String(perEmail.retryAfterSeconds) });

  if (mode === "supabase") {
    const raw = read.value as { locale?: unknown };
    const locale = typeof raw.locale === "string" && isLocale(raw.locale) ? raw.locale : "en";
    // In production the link must name our own host, never one taken from the request.
    if (process.env.NODE_ENV === "production" && !brand.siteUrl) return apiError(503, "site_url_missing", "The site address is not configured.");
    const origin = process.env.NODE_ENV === "production" ? brand.siteUrl.replace(/\/+$/, "") : new URL(req.url).origin;
    const result = await sendMagicLink(supabaseConfig()!, parsed.data.email, `${origin}/auth/callback?l=${locale}`);
    if (result === "rate_limited") return apiError(429, "email_rate_limited", "Too many emails were sent. Try again later.");
    if (result === "error") return apiError(502, "email_failed", "The sign-in email could not be sent.");
    return apiJson({ ok: true, magicLink: true });
  }

  const user = await startSession(parsed.data.email);
  return apiJson({ ok: true, email: user.email });
}
