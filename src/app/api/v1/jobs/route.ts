import { z } from "zod";
import { readBodyCapped } from "@/lib/api";
import { apiGenerationEnabled, v1Error, v1Json, withToken } from "@/lib/api-tokens";
import { ImageError, MAX_IMAGE_BYTES, validateAndNormalizeImage, type NormalizedImage } from "@/lib/image";
import { createProviderModel, refreshEngineSwitches, type ProviderInput } from "@/lib/jobs";
import { checkQuote } from "@/lib/quotes";
import { category, sku, title } from "@/lib/schemas";
import { toDto } from "@/lib/store";
import { IMAGE_VIEWS, MAX_PROMPT_CHARS, TEXTURE_RESOLUTIONS, type ImageView } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z
  .object({
    quoteId: z.string().min(1).max(1024),
    engineId: z.string().min(1).max(64),
    title,
    sku,
    category,
    texture: z.enum(TEXTURE_RESOLUTIONS),
    prompt: z.string().trim().min(10).max(MAX_PROMPT_CHARS).optional(),
    /** Base64-encoded photos by view. */
    images: z.partialRecord(z.enum(IMAGE_VIEWS), z.string().max(Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 16)).optional(),
    rightsAffirmed: z.literal(true),
  })
  .strict();

/**
 * The same path as the web: same engines, quote check, balance and refunds. It differs in being stricter: a current quote and an idempotency key are required,
 * so a program that retries cannot pay twice.
 */
export const POST = withToken("jobs:write", async (req, token) => {
  if (!apiGenerationEnabled()) return v1Error(503, "api_generation_disabled", "Starting generations through the API is not enabled on this server.");
  const idempotencyKey = req.headers.get("idempotency-key");
  if (!idempotencyKey || !/^[A-Za-z0-9_-]{8,80}$/.test(idempotencyKey)) return v1Error(422, "idempotency_key_required", "Send an Idempotency-Key header of 8 to 80 characters.");
  const raw = await readBodyCapped(req, IMAGE_VIEWS.length * Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 64 * 1024);
  if (!raw) return v1Error(413, "too_large", "Request body is too large.");
  let json: unknown;
  try {
    json = JSON.parse(raw.toString("utf8"));
  } catch {
    return v1Error(400, "invalid_json", "Invalid JSON body.");
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return v1Error(422, "validation", "Check the request fields. Use either prompt or images, and confirm rightsAffirmed.");
  const d = parsed.data;
  if (Boolean(d.prompt) === Boolean(d.images)) return v1Error(422, "validation", "Send either prompt or images.");

  let source: ProviderInput;
  if (d.prompt) {
    source = { kind: "text", prompt: d.prompt };
  } else {
    const images: Partial<Record<ImageView, NormalizedImage>> = {};
    for (const [view, b64] of Object.entries(d.images ?? {}) as [ImageView, string][]) {
      try {
        images[view] = await validateAndNormalizeImage({ buffer: Buffer.from(b64, "base64"), declaredMime: null });
      } catch (e) {
        if (e instanceof ImageError) return v1Error(422, "invalid_image", `The ${view} image is not valid (${e.code}).`);
        throw e;
      }
    }
    if (!images.front) return v1Error(422, "validation", "The front image is required.");
    source = Object.keys(images).length === 1 ? { kind: "image", image: images.front } : { kind: "multi-image", images };
  }

  await refreshEngineSwitches().catch(() => undefined);
  const photoCount = source.kind === "text" ? 0 : source.kind === "image" ? 1 : Object.keys(source.images).length;
  const check = checkQuote(d.quoteId, token.orgId, d.engineId, { mode: source.kind, photoCount, texture: d.texture });
  if (check !== "ok") return v1Error(409, check === "expired" ? "quote_expired" : "quote_mismatch", "The quote is not valid for this request. Ask for a new one.");

  const result = await createProviderModel(token.orgId, { engineId: d.engineId, title: d.title, sku: d.sku, category: d.category, textureResolution: d.texture, idempotencyKey, source });
  if (!result.ok) return v1Error(result.httpStatus, result.code, result.message);
  return v1Json({ job: toDto(result.model), duplicate: result.duplicate }, result.duplicate ? 200 : 202);
});
