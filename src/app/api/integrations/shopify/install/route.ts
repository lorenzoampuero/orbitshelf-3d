import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiError, withUser } from "@/lib/api";
import { encryptionConfigured } from "@/lib/secrets";
import { signState, siteOrigin } from "@/lib/shopify-session";
import { authorizeUrl, normalizeShop, shopifyConfig } from "@/lib/shopify";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "os_shopify_state";

/** Sends the person to Shopify. The state is bound to this workspace and shop, so a callback cannot connect someone else's store. */
export const GET = withUser(async (req, user) => {
  const cfg = shopifyConfig();
  if (!cfg || !encryptionConfigured()) return apiError(503, "shopify_not_configured", "The Shopify connection is not configured on this server.");
  const shop = normalizeShop(new URL(req.url).searchParams.get("shop") ?? "");
  if (!shop) return apiError(422, "invalid_shop", "Enter a store address such as mystore.myshopify.com.");
  const nonce = randomBytes(16).toString("base64url");
  const jar = await cookies();
  jar.set(STATE_COOKIE, `${nonce}.${signState(nonce, user.orgId, shop)}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" && !process.env.ORBITSHELF_TEST, path: "/api/integrations/shopify", maxAge: 600 });
  return NextResponse.redirect(authorizeUrl(cfg, shop, `${siteOrigin(req)}/api/integrations/shopify/callback`, nonce));
});
