import { apiError, readBodyCapped, withUser } from "@/lib/api";
import { apiJson } from "@/lib/api";
import { ImageError, validateAndNormalizeImage } from "@/lib/image";
import { rateLimit } from "@/lib/rate-limit";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

const MAX_BYTES = 4 * 1024 * 1024;

export const GET = withUser<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const thumb = await store.readThumbnail(user.orgId, id);
  if (!thumb) return apiError(404, "not_found", "No thumbnail yet.");
  return new Response(new Uint8Array(thumb.data), { status: 200, headers: { "Content-Type": thumb.mime, "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" } });
});

/** A picture the browser rendered from the model itself. It goes through the same image checks as any upload. */
export const PUT = withUser<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const rl = await rateLimit(`thumb:${user.orgId}`, 30, 60_000);
  if (!rl.ok) return apiError(429, "rate_limited", "Too many requests.");
  const model = await store.getModel(user.orgId, id);
  if (!model) return apiError(404, "not_found", "Model not found.");
  const raw = await readBodyCapped(req, MAX_BYTES);
  if (!raw) return apiError(413, "too_large", "Thumbnail is too large.");
  try {
    const image = await validateAndNormalizeImage({ buffer: raw, declaredMime: req.headers.get("content-type") });
    await store.saveThumbnail(user.orgId, id, image.buffer, image.ext);
    return apiJson({ ok: true });
  } catch (e) {
    if (e instanceof ImageError) return apiError(422, "invalid_image", "This is not a valid image.");
    throw e;
  }
});
