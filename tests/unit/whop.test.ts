import { createHmac } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as webhook } from "@/app/api/webhooks/whop/route";
import { PLAN_TIERS } from "@/lib/credits";
import { store } from "@/lib/store";
import { catalogItem, CHECKOUT_CATALOG, createCheckout, decideGrant, parseWhopEvent, verifyWhopWebhook, WhopError, type WhopCheckoutConfig } from "@/lib/whop";

const SECRET = "ws_test_secret_value";
const NOW = 1_800_000_000_000;
const sign = (id: string, ts: number, body: string, secret = SECRET) => `v1,${createHmac("sha256", secret).update(`${id}.${ts}.${body}`).digest("base64")}`;
const hdr = (id: string, ts: number, body: string, secret = SECRET) => ({ id, timestamp: String(ts), signature: sign(id, ts, body, secret) });
const seconds = (ms: number) => Math.floor(ms / 1000);

describe("Whop signature", () => {
  const body = JSON.stringify({ type: "payment.succeeded", data: { id: "pay_1" } });
  const raw = Buffer.from(body);
  const ts = seconds(NOW);

  it("accepts a correct signature over the raw body", () => {
    expect(verifyWhopWebhook(raw, hdr("msg_1", ts, body), SECRET, NOW)).toBe(true);
  });

  it("accepts one valid signature among several listed", () => {
    const h = hdr("msg_1", ts, body);
    expect(verifyWhopWebhook(raw, { ...h, signature: `v1,${Buffer.from("junk").toString("base64")} ${h.signature}` }, SECRET, NOW)).toBe(true);
  });

  it("rejects a wrong secret, a changed body, a changed id and missing headers", () => {
    expect(verifyWhopWebhook(raw, hdr("msg_1", ts, body, "ws_other"), SECRET, NOW)).toBe(false);
    expect(verifyWhopWebhook(Buffer.from(body.replace("pay_1", "pay_2")), hdr("msg_1", ts, body), SECRET, NOW)).toBe(false);
    expect(verifyWhopWebhook(raw, { ...hdr("msg_1", ts, body), id: "msg_2" }, SECRET, NOW)).toBe(false);
    expect(verifyWhopWebhook(raw, { id: null, timestamp: String(ts), signature: "v1,x" }, SECRET, NOW)).toBe(false);
    expect(verifyWhopWebhook(raw, { id: "msg_1", timestamp: null, signature: "v1,x" }, SECRET, NOW)).toBe(false);
    expect(verifyWhopWebhook(raw, { id: "msg_1", timestamp: String(ts), signature: null }, SECRET, NOW)).toBe(false);
  });

  it("rejects an old or future timestamp, however good the signature", () => {
    expect(verifyWhopWebhook(raw, hdr("msg_1", ts - 301, body), SECRET, NOW)).toBe(false);
    expect(verifyWhopWebhook(raw, hdr("msg_1", ts + 301, body), SECRET, NOW)).toBe(false);
    expect(verifyWhopWebhook(raw, hdr("msg_1", ts - 299, body), SECRET, NOW)).toBe(true);
  });

  it("rejects a malformed timestamp and a signature with another version", () => {
    expect(verifyWhopWebhook(raw, { ...hdr("msg_1", ts, body), timestamp: "abc" }, SECRET, NOW)).toBe(false);
    expect(verifyWhopWebhook(raw, { ...hdr("msg_1", ts, body), signature: sign("msg_1", ts, body).replace("v1,", "v2,") }, SECRET, NOW)).toBe(false);
  });
});

describe("what can be bought", () => {
  it("every plan step and pack is in the catalogue with the credits OrbitShelf sized", () => {
    for (const t of PLAN_TIERS) for (const s of t.steps) expect(catalogItem(`plan:${t.id}:${s.priceUsd}`)).toMatchObject({ priceUsd: s.priceUsd, credits: s.credits, recurring: true });
    expect(catalogItem("pack:15")).toMatchObject({ credits: 150, recurring: false });
    expect(catalogItem("pack:40")).toMatchObject({ credits: 450 });
    expect(catalogItem("pack:100")).toMatchObject({ credits: 1150 });
    expect(new Set(CHECKOUT_CATALOG.map((i) => i.key)).size).toBe(CHECKOUT_CATALOG.length);
  });

  it("knows nothing about an item it never offered", () => {
    expect(catalogItem("plan:creator:1")).toBeNull();
    expect(catalogItem("")).toBeNull();
    expect(catalogItem("pack:15; drop")).toBeNull();
  });
});

describe("deciding a grant", () => {
  const event = (data: Record<string, unknown>, type = "payment.succeeded") => ({ id: "msg_1", type, data });

  it("credits the catalogue amount to the workspace in the metadata, keyed by payment id", () => {
    const d = decideGrant(event({ id: "pay_1", usd_total: 49, metadata: { org_id: "org_1", item: "plan:creator:49" } }));
    expect(d).toMatchObject({ ok: true, orgId: "org_1", key: "whop:pay_1", credits: catalogItem("plan:creator:49")!.credits });
  });

  it("ignores every other event type", () => {
    for (const type of ["payment.failed", "membership.activated", "refund.created", "dispute.created"]) expect(decideGrant(event({ id: "pay_1", metadata: { org_id: "o", item: "pack:15" } }, type))).toEqual({ ok: false, reason: "ignored" });
  });

  it("does not credit when the metadata or payment id is missing or the item is unknown", () => {
    expect(decideGrant(event({ id: "pay_1" }))).toEqual({ ok: false, reason: "no_metadata" });
    expect(decideGrant(event({ id: "pay_1", metadata: { org_id: "o" } }))).toEqual({ ok: false, reason: "no_metadata" });
    expect(decideGrant(event({ metadata: { org_id: "o", item: "pack:15" } }))).toEqual({ ok: false, reason: "no_payment_id" });
    expect(decideGrant(event({ id: "pay_1", metadata: { org_id: "o", item: "pack:9999" } }))).toEqual({ ok: false, reason: "unknown_item" });
  });

  it("ignores credits the payload claims, and refuses a payment that does not cover the price", () => {
    const rich = decideGrant(event({ id: "pay_1", credits: 999999, metadata: { org_id: "o", item: "pack:15", credits: 999999 } }));
    expect(rich).toMatchObject({ ok: true, credits: 150 });
    expect(decideGrant(event({ id: "pay_1", usd_total: 1, metadata: { org_id: "o", item: "plan:creator:49" } }))).toEqual({ ok: false, reason: "underpaid" });
    expect(decideGrant(event({ id: "pay_1", total: "15", metadata: { org_id: "o", item: "pack:15" } }))).toMatchObject({ ok: true });
  });
});

describe("parsing", () => {
  it("returns null for anything that is not an event", () => {
    expect(parseWhopEvent(Buffer.from("nope"))).toBeNull();
    expect(parseWhopEvent(Buffer.from("{}"))).toBeNull();
    expect(parseWhopEvent(Buffer.from('{"type":"x"}'))).toBeNull();
    expect(parseWhopEvent(Buffer.from('{"type":"x","data":{"id":"a"}}'))).toMatchObject({ type: "x", data: { id: "a" } });
  });
});

describe("creating a checkout", () => {
  const cfg: WhopCheckoutConfig = { apiKey: "key_test", companyId: "biz_1", apiBase: "https://api.whop.test/v1", returnUrl: "https://app.test/billing" };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

  it("sends the item, workspace and price, and returns Whop's address", async () => {
    let seen: { url: string; init: RequestInit } | null = null;
    const fake = ((url: string, init: RequestInit) => {
      seen = { url, init };
      return Promise.resolve(json({ purchase_url: "https://whop.com/checkout/plan_abc" }));
    }) as unknown as typeof fetch;
    const url = await createCheckout(cfg, { orgId: "org_1", item: catalogItem("plan:creator:49")! }, { fetch: fake });
    expect(url).toBe("https://whop.com/checkout/plan_abc");
    expect(seen!.url).toBe("https://api.whop.test/v1/checkout_configurations");
    expect((seen!.init.headers as Record<string, string>).Authorization).toBe("Bearer key_test");
    const sent = JSON.parse(String(seen!.init.body));
    expect(sent).toMatchObject({ metadata: { org_id: "org_1", item: "plan:creator:49" }, redirect_url: "https://app.test/billing", plan: { company_id: "biz_1", plan_type: "renewal", renewal_price: 49 } });
  });

  it("charges a pack once", async () => {
    let body: Record<string, unknown> = {};
    const fake = ((_u: string, init: RequestInit) => {
      body = JSON.parse(String(init.body));
      return Promise.resolve(json({ purchase_url: "https://whop.com/checkout/x" }));
    }) as unknown as typeof fetch;
    await createCheckout(cfg, { orgId: "o", item: catalogItem("pack:40")! }, { fetch: fake });
    expect(body.plan).toMatchObject({ plan_type: "one_time", initial_price: 40 });
    expect(JSON.stringify(body.plan)).not.toContain("renewal_price");
  });

  it("fails clearly when Whop errors or returns an address off whop.com", async () => {
    const item = catalogItem("pack:15")!;
    await expect(createCheckout(cfg, { orgId: "o", item }, { fetch: (() => Promise.resolve(json({}, 500))) as unknown as typeof fetch })).rejects.toBeInstanceOf(WhopError);
    await expect(createCheckout(cfg, { orgId: "o", item }, { fetch: (() => Promise.resolve(json({ purchase_url: "https://evil.test/whop.com" }))) as unknown as typeof fetch })).rejects.toBeInstanceOf(WhopError);
    await expect(createCheckout(cfg, { orgId: "o", item }, { fetch: (() => Promise.resolve(json({ purchase_url: "http://whop.com/x" }))) as unknown as typeof fetch })).rejects.toBeInstanceOf(WhopError);
    await expect(createCheckout(cfg, { orgId: "o", item }, { fetch: (() => Promise.resolve(json({}))) as unknown as typeof fetch })).rejects.toBeInstanceOf(WhopError);
  });
});

describe("webhook route", () => {
  const tmpRoot = mkdtempSync(path.join(os.tmpdir(), "orbitshelf-whop-"));
  let n = 0;
  beforeEach(() => {
    process.env.DATA_DIR = path.join(tmpRoot, "t" + ++n);
    process.env.LOCAL_FREE_CREDITS = "100";
    process.env.SESSION_SECRET = "unit-test-session-secret-32-characters-long";
    process.env.WHOP_WEBHOOK_SECRET = SECRET;
  });
  afterEach(() => {
    delete process.env.WHOP_WEBHOOK_SECRET;
  });
  afterAll(() => rmSync(tmpRoot, { recursive: true, force: true }));

  const send = (body: string, h: { id: string; timestamp: string; signature: string } | null) =>
    webhook(new Request("https://app.test/api/webhooks/whop", { method: "POST", body, headers: h ? { "webhook-id": h.id, "webhook-timestamp": h.timestamp, "webhook-signature": h.signature } : {} }));
  const now = () => seconds(Date.now());
  const payment = (orgId: string, over: Record<string, unknown> = {}) => JSON.stringify({ type: "payment.succeeded", data: { id: "pay_77", usd_total: 15, metadata: { org_id: orgId, item: "pack:15" }, ...over } });

  it("answers 404 when Whop is not configured, so the endpoint does not exist", async () => {
    delete process.env.WHOP_WEBHOOK_SECRET;
    expect((await send("{}", null)).status).toBe(404);
  });

  it("answers 401 to a bad or missing signature and credits nothing", async () => {
    const { org } = await store.signIn("w1@example.com");
    const body = payment(org.id);
    expect((await send(body, null)).status).toBe(401);
    expect((await send(body, hdr("m1", now(), body, "ws_wrong"))).status).toBe(401);
    expect((await store.usage(org.id)).balance).toBe(100);
  });

  it("credits a signed payment once, however many times Whop delivers it", async () => {
    const { org } = await store.signIn("w2@example.com");
    const body = payment(org.id);
    const first = await send(body, hdr("m1", now(), body));
    expect(first.status).toBe(200);
    expect(await first.json()).toMatchObject({ credited: true });
    expect((await store.usage(org.id)).balance).toBe(250);
    const again = await send(body, hdr("m2", now(), body));
    expect(again.status).toBe(200);
    expect(await again.json()).toMatchObject({ credited: false, result: "duplicate" });
    expect((await store.usage(org.id)).balance).toBe(250);
  });

  it("acknowledges but does not credit a payment for a workspace that does not exist, or other events", async () => {
    const { org } = await store.signIn("w3@example.com");
    const ghost = payment("00000000-0000-0000-0000-000000000000");
    const r = await send(ghost, hdr("m1", now(), ghost));
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ credited: false, reason: "unknown_org" });
    const other = JSON.stringify({ type: "payment.failed", data: { id: "pay_9", metadata: { org_id: org.id, item: "pack:15" } } });
    expect(await (await send(other, hdr("m2", now(), other))).json()).toMatchObject({ credited: false, reason: "ignored" });
    expect((await store.usage(org.id)).balance).toBe(100);
  });

  it("answers 400 to a signed body that is not an event", async () => {
    const body = "not json";
    expect((await send(body, hdr("m1", now(), body))).status).toBe(400);
  });
});
