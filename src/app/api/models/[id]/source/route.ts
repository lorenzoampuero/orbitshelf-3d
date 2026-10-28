import { apiError, withUser } from "@/lib/api";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

/** The (metadata-stripped) source photo, shown beside the 3D model during review. Owner-only. */
export const GET = withUser<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const img = await store.readSourceImage(user.orgId, id);
  if (!img) return apiError(404, "not_found", "No source image for this model.");
  return new Response(new Uint8Array(img.data), {
    headers: { "Content-Type": img.mime, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Disposition": "inline" },
  });
});
