import { NextResponse } from "next/server";
import { shopifyConfig, verifyWebhookHmac } from "@/lib/shopify";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 1024 * 1024;

/**
 * Uninstalling the app or asking to erase a shop ends the connection at once. The models stay: they belong to the OrbitShelf workspace, not the store.
 * customers/data_request and customers/redact need no work: OrbitShelf stores no data about a shop's customers.
 */
export async function POST(req: Request) {
  const cfg = shopifyConfig();
  if (!cfg) return new NextResponse(null, { status: 404 });
  const rawBody = Buffer.from(await req.arrayBuffer());
  if (rawBody.byteLength > MAX_BODY_BYTES) return new NextResponse(null, { status: 413 });
  if (!verifyWebhookHmac(rawBody, req.headers.get("x-shopify-hmac-sha256"), cfg.clientSecret)) return new NextResponse(null, { status: 401 });
  const topic = req.headers.get("x-shopify-topic") ?? "";
  const shop = req.headers.get("x-shopify-shop-domain") ?? "";
  if ((topic === "app/uninstalled" || topic === "shop/redact") && shop) await store.revokeIntegrationsForShop(shop);
  return new NextResponse(null, { status: 200 });
}
