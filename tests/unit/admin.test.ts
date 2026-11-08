import { createHmac } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as webhook } from "@/app/api/webhooks/whop/route";
import { POST as adjust } from "@/app/api/admin/credits/route";
import { adminEmails, isAdminEmail, isAdminUser } from "@/lib/admin";
import { currentUser } from "@/lib/api";
import { firstModelProgress, lowCredits } from "@/lib/first-model";
import { store } from "@/lib/store";
import { billingNeedsAttention } from "@/lib/store-shared";

vi.mock("@/lib/api", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/api")>();
  return { ...real, currentUser: vi.fn() };
});

const root = mkdtempSync(path.join(os.tmpdir(), "orbitshelf-admin-"));
let n = 0;
beforeEach(() => {
  process.env.DATA_DIR = path.join(root, "t" + ++n);
  process.env.LOCAL_FREE_CREDITS = "100";
  process.env.SESSION_SECRET = "unit-test-session-secret-32-characters-long";
  process.env.ADMIN_EMAILS = " Owner@Example.com , second@example.com ";
});
afterEach(() => {
  delete process.env.ADMIN_EMAILS;
  vi.mocked(currentUser).mockReset();
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("who is an administrator", () => {
  it("reads ADMIN_EMAILS, trimmed and case-insensitive", () => {
    expect(adminEmails()).toEqual(["owner@example.com", "second@example.com"]);
    expect(isAdminEmail("OWNER@example.com")).toBe(true);
    expect(isAdminEmail("  second@example.com")).toBe(true);
    expect(isAdminEmail("someone@example.com")).toBe(false);
  });

  it("with the variable empty or missing there are no administrators", () => {
    process.env.ADMIN_EMAILS = "";
    expect(adminEmails()).toEqual([]);
    expect(isAdminEmail("owner@example.com")).toBe(false);
    delete process.env.ADMIN_EMAILS;
    expect(isAdminEmail("owner@example.com")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });

  it("a signed-out visitor is never an administrator", () => {
    expect(isAdminUser(null)).toBe(false);
    expect(isAdminUser({ userId: "u", orgId: "o", email: "owner@example.com" })).toBe(true);
  });
});

describe("POST /api/admin/credits", () => {
  const post = (body: unknown, headers: Record<string, string> = {}) =>
    adjust(new Request("https://app.test/api/admin/credits", { method: "POST", body: JSON.stringify(body), headers }));
  const asAdmin = () => vi.mocked(currentUser).mockResolvedValue({ userId: "admin", orgId: "admin-org", email: "owner@example.com" });

  it("answers 404 to anyone who is not an administrator, signed in or not", async () => {
    const { org } = await store.signIn("customer@example.com");
    vi.mocked(currentUser).mockResolvedValue(null);
    expect((await post({ orgId: org.id, delta: 10, reason: "test please" })).status).toBe(404);
    vi.mocked(currentUser).mockResolvedValue({ userId: "u", orgId: org.id, email: "customer@example.com" });
    expect((await post({ orgId: org.id, delta: 10, reason: "test please" })).status).toBe(404);
    expect((await store.usage(org.id)).balance).toBe(100);
  });

  it("refuses a cross-site request even from an administrator", async () => {
    asAdmin();
    const { org } = await store.signIn("customer@example.com");
    const r = await post({ orgId: org.id, delta: 10, reason: "test please" }, { "sec-fetch-site": "cross-site" });
    expect(r.status).toBe(403);
    expect((await store.usage(org.id)).balance).toBe(100);
  });

  it("validates the body: whole non-zero amount, a written reason, a real workspace", async () => {
    asAdmin();
    const { org } = await store.signIn("customer@example.com");
    expect((await post({ orgId: org.id, delta: 0, reason: "nothing" })).status).toBe(400);
    expect((await post({ orgId: org.id, delta: 1.5, reason: "fraction" })).status).toBe(400);
    expect((await post({ orgId: org.id, delta: 10, reason: "x" })).status).toBe(400);
    expect((await post({ orgId: org.id, delta: 999_999, reason: "too much" })).status).toBe(400);
    expect((await post({ orgId: "no-such-org", delta: 10, reason: "ghost org" })).status).toBe(404);
    expect((await store.usage(org.id)).balance).toBe(100);
  });

  it("applies a grant and a correction, and lists both for the owner", async () => {
    asAdmin();
    const { org } = await store.signIn("customer@example.com");
    const up = await post({ orgId: org.id, delta: 25, reason: "courtesy grant" });
    expect(up.status).toBe(200);
    expect(await up.json()).toMatchObject({ ok: true, balance: 125 });
    const down = await post({ orgId: org.id, delta: -5, reason: "typo correction" });
    expect(await down.json()).toMatchObject({ balance: 120 });
    const events = await store.listBillingEvents(10);
    expect(events.filter((e) => e.kind === "admin_adjustment")).toHaveLength(2);
    expect(events[0].detail).toContain("owner@example.com");
    expect(events.some(billingNeedsAttention)).toBe(false);
  });

  it("never takes a balance below zero", async () => {
    asAdmin();
    const { org } = await store.signIn("customer@example.com");
    const r = await post({ orgId: org.id, delta: -101, reason: "too deep" });
    expect(r.status).toBe(409);
    expect((await store.usage(org.id)).balance).toBe(100);
  });

  it("settles a pending payment event when it names the payment", async () => {
    asAdmin();
    const { org } = await store.signIn("customer@example.com");
    await store.recordBillingEvent({ kind: "refund", paymentId: "pay_42", orgId: null, credits: 0, outcome: "manual_review", detail: "refund.created" });
    expect(await store.listBillingEvents(10, true)).toHaveLength(1);
    const r = await post({ orgId: org.id, delta: -50, reason: "reverse refund", resolvesPaymentId: "pay_42" });
    expect(r.status).toBe(200);
    expect(await store.listBillingEvents(10, true)).toHaveLength(0);
    expect((await store.adminSummary()).needsAttention).toBe(0);
  });
});

describe("the Whop webhook leaves a trail for the owner", () => {
  const SECRET = "ws_test_secret_value";
  const sign = (id: string, ts: number, body: string) => `v1,${createHmac("sha256", SECRET).update(`${id}.${ts}.${body}`).digest("base64")}`;
  const send = (body: string, id: string) => {
    const ts = Math.floor(Date.now() / 1000);
    return webhook(new Request("https://app.test/api/webhooks/whop", { method: "POST", body, headers: { "webhook-id": id, "webhook-timestamp": String(ts), "webhook-signature": sign(id, ts, body) } }));
  };
  beforeEach(() => {
    process.env.WHOP_WEBHOOK_SECRET = SECRET;
  });
  afterEach(() => {
    delete process.env.WHOP_WEBHOOK_SECRET;
  });

  it("records a credited payment as done, and a refund or an unknown workspace as pending", async () => {
    const { org } = await store.signIn("buyer@example.com");
    const ok = JSON.stringify({ type: "payment.succeeded", data: { id: "pay_1", usd_total: 15, metadata: { org_id: org.id, item: "pack:15" } } });
    expect((await send(ok, "m1")).status).toBe(200);
    const ghost = JSON.stringify({ type: "payment.succeeded", data: { id: "pay_2", usd_total: 15, metadata: { org_id: "00000000-0000-0000-0000-000000000000", item: "pack:15" } } });
    await send(ghost, "m2");
    const refund = JSON.stringify({ type: "refund.created", data: { id: "rf_1", payment_id: "pay_1", metadata: { org_id: org.id, item: "pack:15" } } });
    await send(refund, "m3");
    // Delivered twice: still one credited row.
    await send(ok, "m4");

    const all = await store.listBillingEvents(20);
    expect(all.filter((e) => e.outcome === "credited")).toHaveLength(1);
    const pending = await store.listBillingEvents(20, true);
    expect(pending.map((e) => e.outcome).sort()).toEqual(["manual_review", "unknown_org"]);
    const summary = await store.adminSummary();
    expect(summary).toMatchObject({ paymentsCredited: 1, needsAttention: 2, workspaces: 1 });
    expect(summary.creditsGranted).toBeGreaterThan(0);
  });
});

describe("owner views of the local store", () => {
  it("lists every workspace with its email, balance and models", async () => {
    const a = await store.signIn("a@example.com");
    const b = await store.signIn("b@example.com");
    await store.adjustBalance(b.org.id, 40, "adjustment", "t-1");
    const rows = await store.adminWorkspaces();
    expect(rows).toHaveLength(2);
    const rowB = rows.find((r) => r.orgId === b.org.id)!;
    expect(rowB).toMatchObject({ email: "b@example.com", balance: 140, models: 0 });
    expect(rows.find((r) => r.orgId === a.org.id)).toMatchObject({ email: "a@example.com", balance: 100 });
    expect(await store.adminSummary()).toMatchObject({ workspaces: 2, users: 2, models: 0, needsAttention: 0 });
  });
});

describe("first model progress", () => {
  const m = (over: Partial<Parameters<typeof firstModelProgress>[0][number]> = {}) => ({ id: "m1", status: "ready" as const, reviewState: "pending" as const, deletedAt: null, ...over });

  it("starts empty: nothing done, nothing to open", () => {
    const p = firstModelProgress([], 0);
    expect(p).toMatchObject({ done: 0, total: 4, complete: false, focusModelId: null });
    expect(Object.values(p.steps)).toEqual(["todo", "todo", "todo", "todo"]);
  });

  it("marks a step done only when its result exists", () => {
    expect(firstModelProgress([m({ status: "processing" })], 0).steps).toEqual({ create: "done", ready: "waiting", approve: "todo", publish: "todo" });
    expect(firstModelProgress([m()], 0).steps).toEqual({ create: "done", ready: "done", approve: "todo", publish: "todo" });
    expect(firstModelProgress([m({ reviewState: "approved" })], 0).steps.approve).toBe("done");
    const all = firstModelProgress([m({ reviewState: "approved" })], 1);
    expect(all).toMatchObject({ done: 4, complete: true });
  });

  it("ignores models in the trash and points the next step at one still to review", () => {
    const p = firstModelProgress([m({ id: "gone", deletedAt: "2026-11-01T00:00:00Z" }), m({ id: "done", reviewState: "approved" }), m({ id: "todo" })], 0);
    expect(p.focusModelId).toBe("todo");
    expect(firstModelProgress([m({ id: "gone", deletedAt: "2026-11-01T00:00:00Z" })], 0).done).toBe(0);
  });

  it("a failed model does not count as ready", () => {
    expect(firstModelProgress([m({ status: "failed" })], 0).steps).toEqual({ create: "done", ready: "todo", approve: "todo", publish: "todo" });
  });

  it("low credits means the balance cannot pay for one more job", () => {
    expect(lowCredits(0)).toBe(true);
    expect(lowCredits(1)).toBe(false);
    expect(lowCredits(9, 10)).toBe(true);
  });
});
