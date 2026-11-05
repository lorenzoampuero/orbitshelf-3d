import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { apiError, apiJson, readJsonCapped, withUser } from "@/lib/api";
import { normalizeDomain } from "@/lib/embeds";
import { rateLimit } from "@/lib/rate-limit";
import { nowIso, store, toEmbedDto } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withUser(async (_req, user) => apiJson({ embeds: (await store.listEmbeds(user.orgId)).map(toEmbedDto) }));

const createSchema = z.object({ modelId: z.string().min(1).max(64), allowedDomains: z.array(z.string().max(255)).max(20) }).strict();

/** Publishing is a person's decision about one reviewed model, so only an approved model can get a public link. */
export const POST = withUser(async (req, user) => {
  const rl = await rateLimit(`embed-create:${user.orgId}`, 20, 60_000);
  if (!rl.ok) return apiError(429, "rate_limited", "Too many requests.", undefined, { "Retry-After": String(rl.retryAfterSeconds) });
  const read = await readJsonCapped(req);
  if (!read.ok) return read.response;
  const parsed = createSchema.safeParse(read.value);
  if (!parsed.success) return apiError(422, "validation", "Check the highlighted fields.");
  const domains: string[] = [];
  for (const d of parsed.data.allowedDomains) {
    if (!d.trim()) continue;
    const host = normalizeDomain(d);
    if (!host) return apiError(422, "invalid_domain", "One of the domains is not valid.", { fields: { allowedDomains: d.slice(0, 80) } });
    if (!domains.includes(host)) domains.push(host);
  }
  const model = await store.getModel(user.orgId, parsed.data.modelId);
  if (!model) return apiError(404, "not_found", "Model not found.");
  if (model.reviewState !== "approved" || model.status !== "ready") return apiError(409, "not_approved", "Approve the model before publishing it.");
  const embed = await store.createEmbed({ id: randomUUID(), token: randomBytes(24).toString("base64url"), orgId: user.orgId, modelId: model.id, allowedDomains: domains, createdAt: nowIso(), revokedAt: null });
  return apiJson({ embed: toEmbedDto(embed) }, 201);
});
