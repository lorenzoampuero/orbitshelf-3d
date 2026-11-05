import "server-only";
import { createHmac } from "node:crypto";
import { decryptSecret, encryptSecret } from "@/lib/secrets";
import { sessionSecret } from "@/lib/session";
import { refreshTokens, shopifyConfig, ShopifyError, type ShopifyConfig } from "@/lib/shopify";
import { store } from "@/lib/store";

const REFRESH_MARGIN_MS = 60_000;

/** Binds an install to this workspace and shop, so a callback cannot connect someone else's store. */
export const signState = (nonce: string, orgId: string, shop: string) => createHmac("sha256", `shopify:${sessionSecret()}`).update(`${nonce}|${orgId}|${shop}`).digest("base64url");

/** The address the person is really using: the Host header, because the server's own URL can name a different host. Set NEXT_PUBLIC_SITE_URL in production. */
export function siteOrigin(req: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return host ? `${req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "")}://${host}` : new URL(req.url).origin;
}

/** The organization's active connection with a usable token, renewing it first if it is about to expire. */
export async function shopifyConnection(orgId: string): Promise<{ cfg: ShopifyConfig; shop: string; token: string } | null> {
  const cfg = shopifyConfig();
  if (!cfg) return null;
  const row = await store.getIntegration(orgId);
  if (!row || row.revokedAt) return null;
  if (row.expiresAt && Date.parse(row.expiresAt) - Date.now() < REFRESH_MARGIN_MS) {
    if (!row.refreshTokenEnc) throw new ShopifyError("The connection expired. Reconnect your store.", 401);
    const next = await refreshTokens(cfg, row.shop, decryptSecret(row.refreshTokenEnc));
    await store.saveIntegration({ ...row, accessTokenEnc: encryptSecret(next.accessToken), refreshTokenEnc: next.refreshToken ? encryptSecret(next.refreshToken) : row.refreshTokenEnc, expiresAt: next.expiresAt });
    return { cfg, shop: row.shop, token: next.accessToken };
  }
  return { cfg, shop: row.shop, token: decryptSecret(row.accessTokenEnc) };
}
