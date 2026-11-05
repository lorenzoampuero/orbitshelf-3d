import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export const SHOPIFY_SCOPES = "read_products,write_products,write_files";
const DEFAULT_API_VERSION = "2026-10";

export type ShopifyConfig = { clientId: string; clientSecret: string; apiVersion: string };

export function shopifyConfig(): ShopifyConfig | null {
  const clientId = process.env.SHOPIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret, apiVersion: process.env.SHOPIFY_API_VERSION?.trim() || DEFAULT_API_VERSION };
}

/** Anchored at both ends, so a host like example.myshopify.com.attacker.test cannot pass. The server sends secrets to this host. */
export const isValidShop = (shop: string) => /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);

export function normalizeShop(raw: string): string | null {
  const value = raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const shop = value.includes(".") ? value : `${value}.myshopify.com`;
  return isValidShop(shop) ? shop : null;
}

/** Test mode points at the local mock server. Outside it a stray variable cannot redirect tokens. */
const base = (shop: string) => (process.env.ORBITSHELF_TEST === "1" && process.env.SHOPIFY_TEST_BASE ? `${process.env.SHOPIFY_TEST_BASE}/${shop}` : `https://${shop}`);

export function authorizeUrl(cfg: ShopifyConfig, shop: string, redirectUri: string, state: string): string {
  const q = new URLSearchParams({ client_id: cfg.clientId, scope: SHOPIFY_SCOPES, redirect_uri: redirectUri, state });
  return `${base(shop)}/admin/oauth/authorize?${q}`;
}

const sameHex = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** As Shopify documents it: every parameter except `hmac`, sorted, joined as key=value, signed with the client secret. */
export function verifyCallbackHmac(params: URLSearchParams, secret: string): boolean {
  const given = params.get("hmac");
  if (!given) return false;
  const message = [...params.entries()]
    .filter(([k]) => k !== "hmac")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return sameHex(createHmac("sha256", secret).update(message).digest("hex"), given.toLowerCase());
}

export function verifyWebhookHmac(rawBody: Buffer, header: string | null, secret: string): boolean {
  if (!header) return false;
  return sameHex(createHmac("sha256", secret).update(rawBody).digest("base64"), header);
}

export type ShopifyTokens = { accessToken: string; refreshToken: string | null; expiresAt: string | null; scopes: string };
type Deps = { fetch?: typeof fetch };

async function tokenRequest(cfg: ShopifyConfig, shop: string, fields: Record<string, string>, deps?: Deps): Promise<ShopifyTokens> {
  const f = deps?.fetch ?? fetch;
  const res = await f(`${base(shop)}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ client_id: cfg.clientId, client_secret: cfg.clientSecret, ...fields }),
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
    redirect: "error",
  });
  if (!res.ok) throw new ShopifyError(`Token request failed (HTTP ${res.status}).`, res.status);
  const j = (await res.json()) as { access_token?: unknown; refresh_token?: unknown; expires_in?: unknown; scope?: unknown };
  if (typeof j.access_token !== "string") throw new ShopifyError("Shopify did not return a token.");
  return {
    accessToken: j.access_token,
    refreshToken: typeof j.refresh_token === "string" ? j.refresh_token : null,
    expiresAt: typeof j.expires_in === "number" ? new Date(Date.now() + j.expires_in * 1000).toISOString() : null,
    scopes: typeof j.scope === "string" ? j.scope : SHOPIFY_SCOPES,
  };
}

/** New public apps must use expiring offline tokens, hence `expiring=1` and the refresh below. */
export const exchangeCode = (cfg: ShopifyConfig, shop: string, code: string, deps?: Deps) => tokenRequest(cfg, shop, { code, expiring: "1" }, deps);
export const refreshTokens = (cfg: ShopifyConfig, shop: string, refreshToken: string, deps?: Deps) => tokenRequest(cfg, shop, { grant_type: "refresh_token", refresh_token: refreshToken }, deps);

export class ShopifyError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ShopifyError";
  }
}

async function graphql<T>(cfg: ShopifyConfig, shop: string, token: string, query: string, variables: Record<string, unknown>, deps?: Deps): Promise<T> {
  const f = deps?.fetch ?? fetch;
  const res = await f(`${base(shop)}/admin/api/${cfg.apiVersion}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
    redirect: "error",
  });
  if (!res.ok) throw new ShopifyError(res.status === 401 || res.status === 403 ? "Shopify rejected the connection. Reconnect your store." : `Shopify returned HTTP ${res.status}.`, res.status);
  const j = (await res.json()) as { data?: T; errors?: { message?: string }[] };
  if (j.errors?.length || !j.data) throw new ShopifyError(j.errors?.[0]?.message?.slice(0, 200) ?? "Shopify returned no data.");
  return j.data;
}

const failOn = (errors: { message?: string }[] | undefined) => {
  if (errors?.length) throw new ShopifyError(errors[0].message?.slice(0, 200) ?? "Shopify refused the request.");
};

export type ShopifyProduct = { id: string; title: string; status: string; imageUrl: string | null };

export async function searchProducts(cfg: ShopifyConfig, shop: string, token: string, q: string, deps?: Deps): Promise<ShopifyProduct[]> {
  const data = await graphql<{ products: { nodes: { id: string; title: string; status: string; featuredMedia?: { preview?: { image?: { url?: string } } } | null }[] } }>(
    cfg,
    shop,
    token,
    `query Products($q: String) { products(first: 20, query: $q, sortKey: TITLE) { nodes { id title status featuredMedia { preview { image { url } } } } } }`,
    { q: q ? `title:*${q.replace(/[^\p{L}\p{N} -]/gu, "")}*` : null },
    deps,
  );
  return data.products.nodes.map((p) => ({ id: p.id, title: p.title, status: p.status, imageUrl: p.featuredMedia?.preview?.image?.url ?? null }));
}

/** Upload → register. Attaching waits for Shopify to finish processing, in `attachWhenReady`. */
export async function uploadModel(cfg: ShopifyConfig, shop: string, token: string, glb: Buffer, filename: string, alt: string, deps?: Deps): Promise<string> {
  const f = deps?.fetch ?? fetch;
  const staged = await graphql<{ stagedUploadsCreate: { stagedTargets: { url: string; resourceUrl: string; parameters: { name: string; value: string }[] }[]; userErrors: { message?: string }[] } }>(
    cfg,
    shop,
    token,
    `mutation Staged($input: [StagedUploadInput!]!) { stagedUploadsCreate(input: $input) { stagedTargets { url resourceUrl parameters { name value } } userErrors { field message } } }`,
    { input: [{ resource: "MODEL_3D", filename, mimeType: "model/gltf-binary", httpMethod: "POST", fileSize: String(glb.byteLength) }] },
    deps,
  );
  failOn(staged.stagedUploadsCreate.userErrors);
  const target = staged.stagedUploadsCreate.stagedTargets[0];
  if (!target) throw new ShopifyError("Shopify did not provide an upload location.");

  const form = new FormData();
  for (const p of target.parameters) form.append(p.name, p.value);
  form.append("file", new Blob([new Uint8Array(glb)], { type: "model/gltf-binary" }), filename);
  const up = await f(target.url, { method: "POST", body: form, signal: AbortSignal.timeout(180_000), cache: "no-store" });
  if (!up.ok) throw new ShopifyError(`The upload to Shopify failed (HTTP ${up.status}).`, up.status);

  const created = await graphql<{ fileCreate: { files: { id: string }[]; userErrors: { message?: string }[] } }>(
    cfg,
    shop,
    token,
    `mutation Create($files: [FileCreateInput!]!) { fileCreate(files: $files) { files { id } userErrors { field message } } }`,
    { files: [{ originalSource: target.resourceUrl, contentType: "MODEL_3D", alt: alt.slice(0, 500) }] },
    deps,
  );
  failOn(created.fileCreate.userErrors);
  const id = created.fileCreate.files[0]?.id;
  if (!id) throw new ShopifyError("Shopify did not register the file.");
  return id;
}

export type AttachResult = "processing" | "published";

/** `fileUpdate` with `referencesToAdd` only adds. `productSet` would replace the product's whole file list, and could wipe its images. */
export async function attachWhenReady(cfg: ShopifyConfig, shop: string, token: string, fileId: string, productId: string, deps?: Deps): Promise<AttachResult> {
  const status = await graphql<{ node: { fileStatus?: string; fileErrors?: { message?: string }[] } | null }>(
    cfg,
    shop,
    token,
    `query Status($id: ID!) { node(id: $id) { ... on File { fileStatus fileErrors { message } } } }`,
    { id: fileId },
    deps,
  );
  const s = status.node?.fileStatus;
  if (s === "FAILED") throw new ShopifyError(status.node?.fileErrors?.[0]?.message?.slice(0, 200) ?? "Shopify could not process the file.");
  if (s !== "READY") return "processing";
  const updated = await graphql<{ fileUpdate: { userErrors: { message?: string }[] } }>(
    cfg,
    shop,
    token,
    `mutation Attach($files: [FileUpdateInput!]!) { fileUpdate(files: $files) { files { id } userErrors { field message code } } }`,
    { files: [{ id: fileId, referencesToAdd: [productId] }] },
    deps,
  );
  failOn(updated.fileUpdate.userErrors);
  return "published";
}
