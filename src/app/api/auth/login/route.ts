import { cookies } from "next/headers";
import { apiError, apiJson, sameOrigin } from "@/lib/api";
import { localAuthAllowed } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { fieldErrors, loginSchema } from "@/lib/schemas";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession } from "@/lib/session";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * LOCAL DEVELOPMENT SIGN-IN. No password: anyone who can reach this server can open any workspace by typing an email.
 * It exists so the MVP is testable without a Supabase project, and is disabled in production unless ALLOW_LOCAL_AUTH=true.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return apiError(403, "bad_origin", "Cross-site requests are not allowed.");
  if (!localAuthAllowed()) return apiError(403, "auth_disabled", "Local sign-in is disabled in production.");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rl = rateLimit(`login:${ip}`, 20, 60_000);
  if (!rl.ok) return apiError(429, "rate_limited", "Too many sign-in attempts.", undefined, { "Retry-After": String(rl.retryAfterSeconds) });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError(400, "invalid_json", "Invalid JSON body.");
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return apiError(422, "validation", "Enter a valid email address.", { fields: fieldErrors(parsed.error) });
  const { user, org } = await store.signIn(parsed.data.email);
  const token = signSession({ userId: user.id, orgId: org.id, email: user.email });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return apiJson({ ok: true, email: user.email });
}
