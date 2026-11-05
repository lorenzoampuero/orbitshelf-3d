import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, encryptionConfigured } from "@/lib/secrets";
import { attachWhenReady, exchangeCode, isValidShop, normalizeShop, uploadModel, verifyCallbackHmac, verifyWebhookHmac, type ShopifyConfig } from "@/lib/shopify";

const cfg: ShopifyConfig = { clientId: "id", clientSecret: "shh", apiVersion: "2026-10" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("store addresses", () => {
  it("accepts only anchored myshopify.com hosts", () => {
    expect(isValidShop("mi-tienda.myshopify.com")).toBe(true);
    for (const bad of ["evil.test", "shop.myshopify.com.evil.test", "evil.test/shop.myshopify.com", "-x.myshopify.com", "shop.myshopify.com:8080", "a b.myshopify.com"]) expect(isValidShop(bad), bad).toBe(false);
  });

  it("normalises what people type, and refuses other hosts", () => {
    expect(normalizeShop("https://Mi-Tienda.myshopify.com/admin")).toBe("mi-tienda.myshopify.com");
    expect(normalizeShop("mi-tienda")).toBe("mi-tienda.myshopify.com");
    expect(normalizeShop("www.mitienda.cl")).toBeNull();
    expect(normalizeShop("")).toBeNull();
  });
});

describe("signatures", () => {
  const sign = (msg: string) => createHmac("sha256", "shh").update(msg).digest("hex");

  it("verifies the callback as Shopify documents it, sorted and without the hmac", () => {
    const params = new URLSearchParams({ shop: "a.myshopify.com", code: "c", state: "s", timestamp: "1" });
    params.set("hmac", sign("code=c&shop=a.myshopify.com&state=s&timestamp=1"));
    expect(verifyCallbackHmac(params, "shh")).toBe(true);
    params.set("shop", "b.myshopify.com");
    expect(verifyCallbackHmac(params, "shh")).toBe(false);
    expect(verifyCallbackHmac(new URLSearchParams({ shop: "a" }), "shh")).toBe(false);
  });

  it("verifies webhooks over the raw body", () => {
    const body = Buffer.from('{"id":1}');
    const good = createHmac("sha256", "shh").update(body).digest("base64");
    expect(verifyWebhookHmac(body, good, "shh")).toBe(true);
    expect(verifyWebhookHmac(Buffer.from('{"id":2}'), good, "shh")).toBe(false);
    expect(verifyWebhookHmac(body, null, "shh")).toBe(false);
  });
});

describe("token encryption", () => {
  beforeEach(() => {
    process.env.INTEGRATIONS_KEY = "unit-test-integrations-key-32-characters";
  });
  afterEach(() => {
    delete process.env.INTEGRATIONS_KEY;
  });

  it("round-trips, differs each time, and detects tampering", () => {
    const a = encryptSecret("token");
    expect(a).not.toContain("token");
    expect(encryptSecret("token")).not.toBe(a);
    expect(decryptSecret(a)).toBe("token");
    const parts = a.split(".");
    parts[3] = Buffer.from("other").toString("base64url");
    expect(() => decryptSecret(parts.join("."))).toThrow();
  });

  it("refuses to store a token without a key", () => {
    delete process.env.INTEGRATIONS_KEY;
    expect(encryptionConfigured()).toBe(false);
    expect(() => encryptSecret("token")).toThrow(/INTEGRATIONS_KEY/);
  });
});

describe("publishing", () => {
  it("requests an expiring offline token", async () => {
    let body = "";
    const f = ((_u: string, init: RequestInit) => {
      body = String(init.body);
      return Promise.resolve(json({ access_token: "t", refresh_token: "r", expires_in: 60, scope: "x" }));
    }) as unknown as typeof fetch;
    const t = await exchangeCode(cfg, "a.myshopify.com", "code", { fetch: f });
    expect(new URLSearchParams(body).get("expiring")).toBe("1");
    expect(t).toMatchObject({ accessToken: "t", refreshToken: "r" });
  });

  it("uploads as MODEL_3D with its size and registers the staged file", async () => {
    const queries: { query: string; variables: Record<string, never> }[] = [];
    const f = ((u: string, init: RequestInit) => {
      if (String(u).startsWith("https://upload.test")) return Promise.resolve(new Response(null, { status: 204 }));
      const q = JSON.parse(String(init.body));
      queries.push(q);
      if (q.query.includes("stagedUploadsCreate")) return Promise.resolve(json({ data: { stagedUploadsCreate: { stagedTargets: [{ url: "https://upload.test/x", resourceUrl: "https://r.test/x", parameters: [] }], userErrors: [] } } }));
      return Promise.resolve(json({ data: { fileCreate: { files: [{ id: "gid://shopify/Model3d/1" }], userErrors: [] } } }));
    }) as unknown as typeof fetch;
    const id = await uploadModel(cfg, "a.myshopify.com", "tok", Buffer.from("glb"), "m.glb", "Alt", { fetch: f });
    expect(id).toBe("gid://shopify/Model3d/1");
    expect(queries[0].variables.input).toEqual([{ resource: "MODEL_3D", filename: "m.glb", mimeType: "model/gltf-binary", httpMethod: "POST", fileSize: "3" }]);
    expect(queries[1].variables.files).toEqual([{ originalSource: "https://r.test/x", contentType: "MODEL_3D", alt: "Alt" }]);
  });

  it("does not attach until Shopify finishes, only adds to the product, and reports a failed file", async () => {
    const seen: string[] = [];
    const responder = (status: string) =>
      ((_u: string, init: RequestInit) => {
        const q = JSON.parse(String(init.body));
        seen.push(q.query);
        if (q.query.includes("fileStatus")) return Promise.resolve(json({ data: { node: { fileStatus: status, fileErrors: status === "FAILED" ? [{ message: "bad mesh" }] : [] } } }));
        expect(q.variables.files[0].referencesToAdd).toEqual(["gid://shopify/Product/1"]);
        return Promise.resolve(json({ data: { fileUpdate: { files: [], userErrors: [] } } }));
      }) as unknown as typeof fetch;

    expect(await attachWhenReady(cfg, "a.myshopify.com", "t", "f", "gid://shopify/Product/1", { fetch: responder("PROCESSING") })).toBe("processing");
    expect(seen.some((q) => q.includes("fileUpdate"))).toBe(false);
    expect(await attachWhenReady(cfg, "a.myshopify.com", "t", "f", "gid://shopify/Product/1", { fetch: responder("READY") })).toBe("published");
    expect(seen.some((q) => q.includes("fileUpdate"))).toBe(true);
    expect(seen.some((q) => q.includes("productSet") || q.includes("productCreateMedia"))).toBe(false);
    await expect(attachWhenReady(cfg, "a.myshopify.com", "t", "f", "gid://shopify/Product/1", { fetch: responder("FAILED") })).rejects.toThrow("bad mesh");
  });
});
