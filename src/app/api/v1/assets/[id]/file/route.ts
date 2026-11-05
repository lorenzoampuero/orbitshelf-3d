import { v1Error, withToken } from "@/lib/api-tokens";
import { safeFilename } from "@/lib/csv";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

export const GET = withToken<Ctx>("assets:read", async (_req, token, { params }) => {
  const { id } = await params;
  const model = await store.getModel(token.orgId, id);
  if (!model) return v1Error(404, "not_found", "Asset not found.");
  const data = await store.readGlb(token.orgId, id);
  if (!data) return v1Error(409, "not_ready", "The file is not available yet.");
  return new Response(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": "model/gltf-binary",
      "Content-Length": String(data.length),
      "Content-Disposition": `attachment; filename="${safeFilename(model.sku || model.title, "model")}.glb"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-OrbitShelf-Provenance": model.provenance,
    },
  });
});
