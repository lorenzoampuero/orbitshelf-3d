import { randomUUID } from "node:crypto";
import { z } from "zod";
import { apiError, apiJson, readJsonCapped, withUser } from "@/lib/api";
import { safeFilename } from "@/lib/csv";
import { rateLimit } from "@/lib/rate-limit";
import { ShopifyError, uploadModel } from "@/lib/shopify";
import { shopifyConnection } from "@/lib/shopify-session";
import { nowIso, store, toPublicationDto } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z
  .object({
    modelId: z.string().min(1).max(64),
    productId: z.string().regex(/^gid:\/\/shopify\/Product\/\d+$/),
    productTitle: z.string().trim().min(1).max(255),
    // Nothing is published without a person saying so for this model and this product.
    confirm: z.literal(true),
  })
  .strict();

export const GET = withUser(async (req, user) => {
  const modelId = new URL(req.url).searchParams.get("modelId") ?? "";
  return apiJson({ publications: (await store.listPublications(user.orgId, modelId)).map(toPublicationDto) });
});

export const POST = withUser(async (req, user) => {
  const rl = await rateLimit(`shopify-publish:${user.orgId}`, 10, 60_000);
  if (!rl.ok) return apiError(429, "rate_limited", "Too many requests.");
  const read = await readJsonCapped(req);
  if (!read.ok) return read.response;
  const parsed = schema.safeParse(read.value);
  if (!parsed.success) return apiError(422, "validation", "Choose a product and confirm the publication.");
  const { modelId, productId, productTitle } = parsed.data;

  const model = await store.getModel(user.orgId, modelId);
  if (!model) return apiError(404, "not_found", "Model not found.");
  if (model.status !== "ready" || model.reviewState !== "approved" || !model.checksum) return apiError(409, "not_approved", "Approve the model before publishing it.");

  try {
    const conn = await shopifyConnection(user.orgId);
    if (!conn) return apiError(409, "not_connected", "Connect your store first.");

    // The same file on the same product is not uploaded twice, so repeating the request cannot duplicate media.
    const previous = (await store.listPublications(user.orgId, modelId)).find((p) => p.checksum === model.checksum && p.shop === conn.shop && p.productId === productId && p.state !== "failed");
    if (previous) return apiJson({ publication: toPublicationDto(previous), duplicate: true });

    const glb = await store.readGlb(user.orgId, modelId);
    if (!glb) return apiError(409, "not_ready", "The model file is not available.");
    const fileId = await uploadModel(conn.cfg, conn.shop, conn.token, glb, `${safeFilename(model.sku || model.title, "model")}.glb`, model.title);
    const t = nowIso();
    const row = { id: randomUUID(), orgId: user.orgId, modelId, checksum: model.checksum, shop: conn.shop, productId, productTitle, state: "processing" as const, remoteFileId: fileId, error: null, createdAt: t, updatedAt: t };
    await store.createPublication(row);
    return apiJson({ publication: toPublicationDto(row) }, 202);
  } catch (e) {
    if (e instanceof ShopifyError) return apiError(502, "shopify_error", e.message);
    throw e;
  }
});
