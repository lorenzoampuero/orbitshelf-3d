import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiError, currentUser } from "@/lib/api";
import { encryptSecret } from "@/lib/secrets";
import { exchangeCode, isValidShop, shopifyConfig, verifyCallbackHmac } from "@/lib/shopify";
import { nowIso, store } from "@/lib/store";
import { signState, siteOrigin } from "@/lib/shopify-session";

export const dynamic = "force-dynamic";

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** All three checks Shopify requires, plus the workspace: state, HMAC and shop format. */
export async function GET(req: Request) {
  const cfg = shopifyConfig();
  if (!cfg) return apiError(503, "shopify_not_configured", "The Shopify connection is not configured on this server.");
  const user = await currentUser();
  if (!user) return apiError(401, "unauthorized", "Sign in first.");
  const params = new URL(req.url).searchParams;
  const shop = params.get("shop") ?? "";
  const code = params.get("code") ?? "";
  const nonce = params.get("state") ?? "";
  const jar = await cookies();
  const cookie = jar.get("os_shopify_state")?.value ?? "";
  const [cookieNonce, cookieSig] = cookie.split(".");
  if (!isValidShop(shop) || !code || !nonce || !cookieNonce || !cookieSig || !same(cookieNonce, nonce) || !same(cookieSig, signState(nonce, user.orgId, shop)) || !verifyCallbackHmac(params, cfg.clientSecret)) {
    return apiError(400, "invalid_callback", "This connection link is not valid. Start again from Settings.");
  }
  jar.delete({ name: "os_shopify_state", path: "/api/integrations/shopify" });
  let tokens;
  try {
    tokens = await exchangeCode(cfg, shop, code);
  } catch {
    return apiError(502, "shopify_token_failed", "Shopify did not complete the connection. Try again.");
  }
  await store.saveIntegration({
    orgId: user.orgId,
    shop,
    accessTokenEnc: encryptSecret(tokens.accessToken),
    refreshTokenEnc: tokens.refreshToken ? encryptSecret(tokens.refreshToken) : null,
    expiresAt: tokens.expiresAt,
    scopes: tokens.scopes,
    connectedAt: nowIso(),
    revokedAt: null,
  });
  return NextResponse.redirect(`${siteOrigin(req)}/dashboard/settings?shopify=connected`);
}
