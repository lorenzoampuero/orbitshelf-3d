import { randomUUID } from "node:crypto";
import { z } from "zod";
import { apiError, apiJson, readJsonCapped, withUser } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { encryptionConfigured, encryptSecret } from "@/lib/secrets";
import { nowIso, store, toWebhookDeliveryDto, toWebhookEndpointDto } from "@/lib/store";
import { checkWebhookUrl, generateWebhookSecret } from "@/lib/webhooks";

export const dynamic = "force-dynamic";

const MAX_ACTIVE = 5;
const schema = z.object({ url: z.string().trim().min(8).max(500) }).strict();

export const GET = withUser(async (_req, user) => {
  const [endpoints, deliveries] = await Promise.all([store.listWebhookEndpoints(user.orgId), store.listWebhookDeliveries(user.orgId)]);
  return apiJson({ endpoints: endpoints.map(toWebhookEndpointDto), deliveries: deliveries.map(toWebhookDeliveryDto) });
});

/** The secret is returned here and only here. What is stored is encrypted. */
export const POST = withUser(async (req, user) => {
  if (!encryptionConfigured()) return apiError(503, "unavailable", "Webhooks are off on this server.");
  const rl = await rateLimit(`webhooks:${user.orgId}`, 20, 60_000);
  if (!rl.ok) return apiError(429, "rate_limited", "Too many requests.");
  const read = await readJsonCapped(req);
  if (!read.ok) return read.response;
  const parsed = schema.safeParse(read.value);
  if (!parsed.success) return apiError(422, "invalid", "That address is not valid.");
  const problem = await checkWebhookUrl(parsed.data.url);
  if (problem) return apiError(422, problem, "That address cannot be used.");
  const active = (await store.listWebhookEndpoints(user.orgId)).filter((e) => !e.disabledAt);
  if (active.length >= MAX_ACTIVE) return apiError(409, "limit", "You can have up to 5 active addresses.");
  const secret = generateWebhookSecret();
  const row = { id: randomUUID(), orgId: user.orgId, url: parsed.data.url, secretEnc: encryptSecret(secret), createdAt: nowIso(), disabledAt: null };
  await store.createWebhookEndpoint(row);
  return apiJson({ secret, endpoint: toWebhookEndpointDto(row) }, 201);
});
