import { apiError, apiJson, withUser } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { searchProducts, ShopifyError } from "@/lib/shopify";
import { shopifyConnection } from "@/lib/shopify-session";

export const dynamic = "force-dynamic";

export const GET = withUser(async (req, user) => {
  const rl = await rateLimit(`shopify-search:${user.orgId}`, 30, 60_000);
  if (!rl.ok) return apiError(429, "rate_limited", "Too many requests.");
  try {
    const conn = await shopifyConnection(user.orgId);
    if (!conn) return apiError(409, "not_connected", "Connect your store first.");
    return apiJson({ products: await searchProducts(conn.cfg, conn.shop, conn.token, (new URL(req.url).searchParams.get("q") ?? "").slice(0, 80)) });
  } catch (e) {
    if (e instanceof ShopifyError) return apiError(502, "shopify_error", e.message);
    throw e;
  }
});
