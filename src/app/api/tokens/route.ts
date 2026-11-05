import { randomUUID } from "node:crypto";
import { z } from "zod";
import { apiError, apiJson, readJsonCapped, withUser } from "@/lib/api";
import { generateToken } from "@/lib/api-tokens";
import { nowIso, store, toApiTokenDto } from "@/lib/store";
import { API_SCOPES } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = withUser(async (_req, user) => apiJson({ tokens: (await store.listApiTokens(user.orgId)).map(toApiTokenDto) }));

const schema = z.object({ name: z.string().trim().min(1).max(60), scopes: z.array(z.enum(API_SCOPES)).min(1) }).strict();

/** The token is returned here and only here. What is stored is its hash. */
export const POST = withUser(async (req, user) => {
  const read = await readJsonCapped(req);
  if (!read.ok) return read.response;
  const parsed = schema.safeParse(read.value);
  if (!parsed.success) return apiError(422, "validation", "Give the token a name and at least one permission.");
  const { token, hash, prefix } = generateToken();
  const row = { id: randomUUID(), orgId: user.orgId, name: parsed.data.name, tokenHash: hash, prefix, scopes: [...new Set(parsed.data.scopes)], createdAt: nowIso(), lastUsedAt: null, revokedAt: null };
  await store.createApiToken(row);
  return apiJson({ token, record: toApiTokenDto(row) }, 201);
});
