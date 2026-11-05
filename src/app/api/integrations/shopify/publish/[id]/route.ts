import { apiError, apiJson, withUser } from "@/lib/api";
import { attachWhenReady, ShopifyError } from "@/lib/shopify";
import { shopifyConnection } from "@/lib/shopify-session";
import { nowIso, store, toPublicationDto } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

/** Advances a publication. Shopify processes the file asynchronously, so the file is attached to the product only once it is ready. */
export const POST = withUser<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const row = await store.getPublication(user.orgId, id);
  if (!row) return apiError(404, "not_found", "Publication not found.");
  if (row.state !== "processing" || !row.remoteFileId) return apiJson({ publication: toPublicationDto(row) });
  try {
    const conn = await shopifyConnection(user.orgId);
    if (!conn || conn.shop !== row.shop) return apiError(409, "not_connected", "This store is no longer connected.");
    const result = await attachWhenReady(conn.cfg, conn.shop, conn.token, row.remoteFileId, row.productId);
    if (result === "processing") return apiJson({ publication: toPublicationDto(row) });
    const next = { ...row, state: "published" as const, updatedAt: nowIso() };
    await store.updatePublication(next);
    return apiJson({ publication: toPublicationDto(next) });
  } catch (e) {
    if (!(e instanceof ShopifyError)) throw e;
    if (e.status === 401 || e.status === 403) return apiError(502, "shopify_error", e.message); // the file may still be fine: reconnecting lets it finish
    const failed = { ...row, state: "failed" as const, error: e.message, updatedAt: nowIso() };
    await store.updatePublication(failed);
    return apiJson({ publication: toPublicationDto(failed) });
  }
});
