import { apiError, withUser } from "@/lib/api";
import { safeFilename } from "@/lib/csv";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

/** Authenticated, owner-only GLB delivery. Never cached by shared caches; never public. */
export const GET = withUser<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const model = await store.getModel(user.orgId, id);
  if (!model) return apiError(404, "not_found", "Model not found.");
  const data = await store.readGlb(user.orgId, id);
  if (!data) return apiError(409, "not_ready", "The model file is not available yet.");
  const download = new URL(req.url).searchParams.get("download") === "1";
  const name = safeFilename(model.sku || model.title, "model") + ".glb";
  return new Response(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": "model/gltf-binary",
      "Content-Length": String(data.length),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${name}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-OrbitShelf-Provenance": model.provenance,
    },
  });
});
