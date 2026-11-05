import { apiError, apiJson, withUser } from "@/lib/api";
import { refreshJob } from "@/lib/jobs";
import { rateLimit } from "@/lib/rate-limit";
import { toDto } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

/** State-changing, so POST (the prototype used GET). Safe to call repeatedly. */
export const POST = withUser<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const rl = await rateLimit(`refresh:${user.orgId}`, 30, 60_000);
  if (!rl.ok) return apiError(429, "rate_limited", "Too many status checks.", undefined, { "Retry-After": String(rl.retryAfterSeconds) });
  const m = await refreshJob(user.orgId, id);
  return m ? apiJson({ model: toDto(m) }) : apiError(404, "not_found", "Model not found.");
});
