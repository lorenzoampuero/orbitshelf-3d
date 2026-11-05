import { apiError, apiJson, readBodyCapped, withUser } from "@/lib/api";
import { providerConfigured } from "@/lib/env";
import { ImageError, MAX_IMAGE_BYTES, validateAndNormalizeImage, type NormalizedImage } from "@/lib/image";
import { createDemoModel, createProviderModel, type ProviderInput } from "@/lib/jobs";
import { rateLimit } from "@/lib/rate-limit";
import { filterModels } from "@/lib/model-filter";
import { demoCreateSchema, fieldErrors, providerFieldsSchema, textCreateSchema } from "@/lib/schemas";
import { store, toDto } from "@/lib/store";
import { IMAGE_VIEWS, type ImageView } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withUser(async (req, user) => {
  const rows = await store.listModels(user.orgId);
  return apiJson({ models: filterModels(rows.map(toDto), Object.fromEntries(new URL(req.url).searchParams)) });
});

const ERROR_MESSAGES: Record<ImageError["code"], string> = {
  empty: "The file is empty.",
  too_large: "Image must be 8 MB or smaller.",
  unsupported_type: "Unsupported file type. Upload a PNG, JPEG or WebP photo.",
  svg_not_allowed: "SVG and markup files are not allowed. Upload a PNG, JPEG or WebP photo.",
  type_mismatch: "The file content does not match its declared type.",
  corrupt: "The image could not be decoded. It may be corrupt or truncated.",
  animated: "Animated images are not supported. Upload a single still photo.",
  too_small: "Image is too small. Minimum 256 px on the shorter side.",
  too_many_pixels: "Image dimensions are too large. Maximum 8192 px per side.",
};

/** Multipart field that carries each photo. `file` is the original single-photo field and means the front view. */
const VIEW_FIELD: Record<ImageView, string> = { front: "frontImage", left: "leftImage", back: "backImage", right: "rightImage" };
const MAX_JSON_BYTES = 16 * 1024;

const idempotencyKeyOf = (req: Request) => {
  const idem = req.headers.get("idempotency-key");
  return idem && /^[A-Za-z0-9_-]{8,80}$/.test(idem) ? idem : null;
};

async function readJson(req: Request) {
  const raw = await readBodyCapped(req, MAX_JSON_BYTES);
  if (!raw) return { error: apiError(413, "too_large", "Request body is too large.") };
  try {
    return { json: JSON.parse(raw.toString("utf8")) as unknown };
  } catch {
    return { error: apiError(400, "invalid_json", "Invalid JSON body.") };
  }
}

function checkProviderLimits(orgId: string) {
  if (!providerConfigured()) {
    return apiError(503, "provider_not_configured", "AI generation is not configured on this server. Use a demo sample or add provider credentials.");
  }
  const rl = rateLimit(`create-job:${orgId}`, 5, 60_000);
  if (!rl.ok) return apiError(429, "rate_limited", "Too many generation requests. Try again shortly.", undefined, { "Retry-After": String(rl.retryAfterSeconds) });
  return null;
}

export const POST = withUser(async (req, user) => {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.startsWith("application/json")) {
    const rl = rateLimit(`create-demo:${user.orgId}`, 30, 60_000);
    if (!rl.ok) return apiError(429, "rate_limited", "Too many requests.", undefined, { "Retry-After": String(rl.retryAfterSeconds) });
    const body = await readJson(req);
    if (body.error) return body.error;
    const source = typeof body.json === "object" && body.json !== null ? (body.json as { source?: unknown }).source : undefined;

    // -- Paid provider job (text -> 3D) --
    if (source === "sloyd-text") {
      const blocked = checkProviderLimits(user.orgId);
      if (blocked) return blocked;
      const parsed = textCreateSchema.safeParse(body.json);
      if (!parsed.success) return apiError(422, "validation", "Check the highlighted fields.", { fields: fieldErrors(parsed.error) });
      const result = await createProviderModel(user.orgId, {
        title: parsed.data.title,
        sku: parsed.data.sku,
        category: parsed.data.category,
        textureResolution: parsed.data.textureResolution,
        idempotencyKey: idempotencyKeyOf(req),
        source: { kind: "text", prompt: parsed.data.prompt },
      });
      if (!result.ok) return apiError(result.httpStatus, result.code, result.message, result.model ? { model: toDto(result.model) } : undefined);
      return apiJson({ model: toDto(result.model), duplicate: result.duplicate }, result.duplicate ? 200 : 202);
    }

    const parsed = demoCreateSchema.safeParse(body.json);
    if (!parsed.success) return apiError(422, "validation", "Check the highlighted fields.", { fields: fieldErrors(parsed.error) });
    const model = await createDemoModel(user.orgId, parsed.data);
    return apiJson({ model: toDto(model) }, 201);
  }

  if (!contentType.startsWith("multipart/form-data")) return apiError(415, "unsupported_media_type", "Send JSON (demo or text) or multipart/form-data (photo job).");

  // -- Paid provider job (1 to 4 photos -> 3D) --
  const blocked = checkProviderLimits(user.orgId);
  if (blocked) return blocked;

  const raw = await readBodyCapped(req, IMAGE_VIEWS.length * MAX_IMAGE_BYTES + 256 * 1024);
  if (!raw) return apiError(413, "image_too_large", ERROR_MESSAGES.too_large, { imageCode: "too_large" });
  let form: FormData;
  try {
    form = await new Response(new Uint8Array(raw), { headers: { "content-type": contentType } }).formData();
  } catch {
    return apiError(400, "invalid_form", "Malformed multipart body.");
  }
  const fields = Object.fromEntries(["source", "title", "sku", "category", "textureResolution", "confirmPaid", "rightsAffirmed"].map((k) => [k, form.get(k) ?? undefined]));
  const parsed = providerFieldsSchema.safeParse({ ...fields, sku: typeof fields.sku === "string" ? fields.sku : null });
  if (!parsed.success) return apiError(422, "validation", "Check the highlighted fields.", { fields: fieldErrors(parsed.error) });

  const images: Partial<Record<ImageView, NormalizedImage>> = {};
  for (const view of IMAGE_VIEWS) {
    const entry = form.get(VIEW_FIELD[view]) ?? (view === "front" ? form.get("file") : null);
    if (!(entry instanceof File)) continue;
    try {
      images[view] = await validateAndNormalizeImage({ buffer: Buffer.from(await entry.arrayBuffer()), declaredMime: entry.type || null });
    } catch (e) {
      if (e instanceof ImageError) return apiError(422, "invalid_image", ERROR_MESSAGES[e.code], { imageCode: e.code, view, fields: { [VIEW_FIELD[view]]: e.code } });
      throw e;
    }
  }
  if (!images.front) return apiError(422, "validation", "Attach the front photo of the product.", { fields: { frontImage: "required" } });

  let source: ProviderInput;
  if (Object.keys(images).length === 1) {
    source = { kind: "image", image: images.front };
  } else {
    source = { kind: "multi-image", images };
  }

  const result = await createProviderModel(user.orgId, {
    title: parsed.data.title,
    sku: parsed.data.sku,
    category: parsed.data.category,
    textureResolution: parsed.data.textureResolution,
    idempotencyKey: idempotencyKeyOf(req),
    source,
  });
  if (!result.ok) return apiError(result.httpStatus, result.code, result.message, result.model ? { model: toDto(result.model) } : undefined);
  return apiJson({ model: toDto(result.model), duplicate: result.duplicate }, result.duplicate ? 200 : 202);
});
