import { apiError, withUser } from "@/lib/api";
import { store } from "@/lib/store";
import { IMAGE_VIEWS, type ImageView } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

/** A (metadata-stripped) source photo, shown beside the 3D model during review. `?view=front|left|back|right`, default front. Owner-only. */
export const GET = withUser<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const requested = new URL(req.url).searchParams.get("view") ?? "front";
  if (!(IMAGE_VIEWS as readonly string[]).includes(requested)) return apiError(422, "validation", "Unknown view.", { fields: { view: "invalid" } });
  const img = await store.readSourceImage(user.orgId, id, requested as ImageView);
  if (!img) return apiError(404, "not_found", "No source image for this model.");
  return new Response(new Uint8Array(img.data), {
    headers: { "Content-Type": img.mime, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Disposition": "inline" },
  });
});
