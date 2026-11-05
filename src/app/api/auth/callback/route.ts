import { z } from "zod";
import { apiError, apiJson, clientIp, readJsonCapped, sameOrigin } from "@/lib/api";
import { startSession } from "@/lib/auth-session";
import { supabaseConfig } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { userFromAccessToken } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

const callbackSchema = z.object({ accessToken: z.string().min(20).max(4096) });

/** Exchanges the access token from a Supabase magic link for the app's own signed session cookie. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return apiError(403, "bad_origin", "Cross-site requests are not allowed.");
  const cfg = supabaseConfig();
  if (!cfg) return apiError(404, "not_found", "Not found.");
  const rl = await rateLimit(`auth-callback:${clientIp(req)}`, 30, 60_000);
  if (!rl.ok) return apiError(429, "rate_limited", "Too many requests.", undefined, { "Retry-After": String(rl.retryAfterSeconds) });
  const read = await readJsonCapped(req, 8192);
  if (!read.ok) return read.response;
  const parsed = callbackSchema.safeParse(read.value);
  if (!parsed.success) return apiError(422, "validation", "Invalid sign-in link.");
  const verified = await userFromAccessToken(cfg, parsed.data.accessToken);
  if (!verified) return apiError(401, "invalid_link", "This sign-in link is invalid or has expired.");
  const user = await startSession(verified.email, verified.id);
  return apiJson({ ok: true, email: user.email });
}
