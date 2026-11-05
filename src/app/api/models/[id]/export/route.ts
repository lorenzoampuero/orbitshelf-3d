import { apiError, withUser } from "@/lib/api";
import { safeFilename } from "@/lib/csv";
import { exportGeometry, type GeometryFormat } from "@/lib/glb-tools";
import { rateLimit } from "@/lib/rate-limit";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

const TYPES: Record<GeometryFormat, string> = { obj: "model/obj", stl: "model/stl" };

/** Geometry-only export of the current version, private to the owner. */
export const GET = withUser<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const format = new URL(req.url).searchParams.get("format");
  if (format !== "obj" && format !== "stl") return apiError(422, "validation", "Choose obj or stl.");
  const rl = await rateLimit(`export:${user.orgId}`, 20, 60_000);
  if (!rl.ok) return apiError(429, "rate_limited", "Too many requests.", undefined, { "Retry-After": String(rl.retryAfterSeconds) });
  const model = await store.getModel(user.orgId, id);
  if (!model) return apiError(404, "not_found", "Model not found.");
  const glb = await store.readGlb(user.orgId, id);
  if (!glb) return apiError(409, "not_ready", "The model file is not available yet.");
  let data: Buffer;
  try {
    data = await exportGeometry(glb, format);
  } catch {
    return apiError(422, "cannot_export", "This file could not be exported.");
  }
  return new Response(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": TYPES[format],
      "Content-Length": String(data.length),
      "Content-Disposition": `attachment; filename="${safeFilename(model.sku || model.title, "model")}.${format}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
