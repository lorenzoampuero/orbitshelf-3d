import { apiError, apiJson, withUser } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { store } from "@/lib/store";
import { enqueuePing } from "@/lib/webhooks";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const DELETE = withUser<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  return (await store.disableWebhookEndpoint(user.orgId, id)) ? apiJson({ ok: true }) : apiError(404, "not_found", "Address not found.");
});

/** Queues a test delivery. The worker sends it the same way as a real one. */
export const POST = withUser<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const rl = await rateLimit(`webhook-test:${user.orgId}`, 10, 60_000);
  if (!rl.ok) return apiError(429, "rate_limited", "Too many requests.");
  const endpoint = (await store.listWebhookEndpoints(user.orgId)).find((e) => e.id === id && !e.disabledAt);
  if (!endpoint) return apiError(404, "not_found", "Address not found.");
  await enqueuePing(user.orgId, endpoint.id);
  return apiJson({ ok: true }, 202);
});
