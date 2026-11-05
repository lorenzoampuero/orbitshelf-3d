import { apiError, apiJson, readBodyCapped, withUser } from "@/lib/api";
import { GlbError, MAX_GLB_BYTES, validateGlb } from "@/lib/glb";
import { createImportedModel } from "@/lib/jobs";
import { rateLimit } from "@/lib/rate-limit";
import { fieldErrors, importFieldsSchema } from "@/lib/schemas";
import { toDto } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** A GLB the user already has. Free, and labelled as imported: it is never described as generated here. */
export const POST = withUser(async (req, user) => {
  const rl = await rateLimit(`import:${user.orgId}`, 20, 60_000);
  if (!rl.ok) return apiError(429, "rate_limited", "Too many requests.", undefined, { "Retry-After": String(rl.retryAfterSeconds) });

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) return apiError(415, "unsupported_media_type", "Send multipart/form-data.");
  const raw = await readBodyCapped(req, MAX_GLB_BYTES + 256 * 1024);
  if (!raw) return apiError(413, "file_too_large", "The file is larger than the allowed maximum.");
  let form: FormData;
  try {
    form = await new Response(new Uint8Array(raw), { headers: { "content-type": contentType } }).formData();
  } catch {
    return apiError(400, "invalid_form", "Malformed multipart body.");
  }
  const fields = Object.fromEntries(["title", "sku", "category", "rightsAffirmed"].map((k) => [k, form.get(k) ?? undefined]));
  const parsed = importFieldsSchema.safeParse({ ...fields, sku: typeof fields.sku === "string" ? fields.sku : null });
  if (!parsed.success) return apiError(422, "validation", "Check the highlighted fields.", { fields: fieldErrors(parsed.error) });

  const file = form.get("file");
  if (!(file instanceof File)) return apiError(422, "validation", "Attach a GLB file.", { fields: { file: "required" } });
  const glb = Buffer.from(await file.arrayBuffer());
  let info;
  try {
    info = validateGlb(glb);
  } catch (e) {
    if (e instanceof GlbError) return apiError(422, "invalid_glb", e.message);
    throw e;
  }
  const model = await createImportedModel(user.orgId, { title: parsed.data.title, sku: parsed.data.sku, category: parsed.data.category, glb, sha256: info.sha256, bytes: info.bytes });
  return apiJson({ model: toDto(model) }, 201);
});
