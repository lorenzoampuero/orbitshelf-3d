import { z } from "zod";
import { readBodyCapped } from "@/lib/api";
import { v1Error, v1Json, withToken } from "@/lib/api-tokens";
import { refreshEngineSwitches } from "@/lib/jobs";
import { createQuote } from "@/lib/quotes";
import { INPUT_KINDS, TEXTURE_RESOLUTIONS } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({ engineId: z.string().min(1).max(64), mode: z.enum(INPUT_KINDS), photoCount: z.number().int().min(0).max(8), texture: z.enum(TEXTURE_RESOLUTIONS) }).strict();

export const POST = withToken("jobs:write", async (req, token) => {
  const raw = await readBodyCapped(req, 4 * 1024);
  if (!raw) return v1Error(413, "too_large", "Request body is too large.");
  let json: unknown;
  try {
    json = JSON.parse(raw.toString("utf8"));
  } catch {
    return v1Error(400, "invalid_json", "Invalid JSON body.");
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return v1Error(422, "validation", "Check engineId, mode, photoCount and texture.");
  await refreshEngineSwitches().catch(() => undefined);
  const { engineId, ...q } = parsed.data;
  const result = createQuote(token.orgId, engineId, q);
  if (!result.ok && result.code === "billing_unsafe") return v1Error(503, "billing_unsafe", "Quotes are paused because of a server billing setting.");
  if (!result.ok) return result.code === "engine_unavailable" ? v1Error(503, result.code, "This engine is not available.") : v1Error(422, result.code, `This engine does not support these options (${result.problem}).`);
  return v1Json({ quote: result.quote });
});
