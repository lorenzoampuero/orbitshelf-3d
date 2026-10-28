import { apiError, apiJson, readBodyCapped, withUser } from "@/lib/api";
import { providerConfigured } from "@/lib/env";
import { ImageError, MAX_IMAGE_BYTES, validateAndNormalizeImage } from "@/lib/image";
import { createDemoModel, createProviderModel } from "@/lib/jobs";
import { rateLimit } from "@/lib/rate-limit";
import { filterModels } from "@/lib/model-filter";
import { demoCreateSchema, fieldErrors, providerFieldsSchema } from "@/lib/schemas";
import { store, toDto } from "@/lib/store";

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

export const POST = withUser(async (req, user) => {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.startsWith("application/json")) {
    const rl = rateLimit(`create-demo:${user.orgId}`, 30, 60_000);
    if (!rl.ok) return apiError(429, "rate_limited", "Too many requests.", undefined, { "Retry-After": String(rl.retryAfterSeconds) });
    const raw = await readBodyCapped(req, 16 * 1024);
    if (!raw) return apiError(413, "too_large", "Request body is too large.");
    let json: unknown;
    try {
      json = JSON.parse(raw.toString("utf8"));
    } catch {
      return apiError(400, "invalid_json", "Invalid JSON body.");
    }
    const parsed = demoCreateSchema.safeParse(json);
    if (!parsed.success) return apiError(422, "validation", "Check the highlighted fields.", { fields: fieldErrors(parsed.error) });
    const model = await createDemoModel(user.orgId, parsed.data);
    return apiJson({ model: toDto(model) }, 201);
  }

  if (!contentType.startsWith("multipart/form-data")) return apiError(415, "unsupported_media_type", "Send JSON (demo) or multipart/form-data (image job).");

  // â”€â”€ Paid provider job (image â†’ 3D) â”€â”€
  if (!providerConfigured()) {
    return apiError(503, "provider_not_configured", "AI generation is not configured on this server. Use a demo sample or add provider credentials.");
  }
  const rl = rateLimit(`create-job:${user.orgId}`, 5, 60_000);
  if (!rl.ok) return apiError(429, "rate_limited", "Too many generation requests. Try again shortly.", undefined, { "Retry-After": String(rl.retryAfterSeconds) });

  const raw = await readBodyCapped(req, MAX_IMAGE_BYTES + 256 * 1024);
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
  const file = form.get("file");
  if (!(file instanceof File)) return apiError(422, "validation", "Attach a product photo.", { fields: { file: "required" } });

  let image;
  try {
    image = await validateAndNormalizeImage({ buffer: Buffer.from(await file.arrayBuffer()), declaredMime: file.type || null });
  } catch (e) {
    if (e instanceof ImageError) return apiError(422, "invalid_image", ERROR_MESSAGES[e.code], { imageCode: e.code, fields: { file: e.code } });
    throw e;
  }

  const idem = req.headers.get("idempotency-key");
  const result = await createProviderModel(user.orgId, {
    title: parsed.data.title,
    sku: parsed.data.sku,
    category: parsed.data.category,
    textureResolution: parsed.data.textureResolution,
    idempotencyKey: idem && /^[A-Za-z0-9_-]{8,80}$/.test(idem) ? idem : null,
    image,
  });
  if (!result.ok) return apiError(result.httpStatus, result.code, result.message, result.model ? { model: toDto(result.model) } : undefined);
  return apiJson({ model: toDto(result.model), duplicate: result.duplicate }, result.duplicate ? 200 : 202);
});

