import { z } from "zod";
import { apiError, apiJson, readBodyCapped, withUser } from "@/lib/api";
import { refreshEngineSwitches } from "@/lib/jobs";
import { createQuote } from "@/lib/quotes";
import { fieldErrors } from "@/lib/schemas";
import { INPUT_KINDS, TEXTURE_RESOLUTIONS } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const quoteSchema = z.object({
  engineId: z.string().min(1).max(64),
  mode: z.enum(INPUT_KINDS),
  photoCount: z.number().int().min(0).max(8),
  texture: z.enum(TEXTURE_RESOLUTIONS),
});

export const POST = withUser(async (req, user) => {
  const raw = await readBodyCapped(req, 4 * 1024);
  if (!raw) return apiError(413, "too_large", "Request body is too large.");
  let json: unknown;
  try {
    json = JSON.parse(raw.toString("utf8"));
  } catch {
    return apiError(400, "invalid_json", "Invalid JSON body.");
  }
  const parsed = quoteSchema.safeParse(json);
  if (!parsed.success) return apiError(422, "validation", "Check the highlighted fields.", { fields: fieldErrors(parsed.error) });
  await refreshEngineSwitches().catch(() => undefined);
  const { engineId, ...q } = parsed.data;
  const result = createQuote(user.orgId, engineId, q);
  if (!result.ok) {
    return result.code === "engine_unavailable"
      ? apiError(503, "engine_unavailable", "This engine is not available.")
      : apiError(422, "engine_unsupported", "This engine does not support these options.", { problem: result.problem });
  }
  return apiJson({ quote: result.quote });
});
