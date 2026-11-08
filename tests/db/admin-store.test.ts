import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { createPostgresStore } from "@/lib/store-postgres";
import { billingNeedsAttention } from "@/lib/store-shared";
import { memoryBlobs, migrate, pgliteClient } from "./sql-client";

/** The owner's billing trail and admin views, on the same schema a Supabase project gets (migration 0009). */
describe("billing events and owner views on Postgres", () => {
  let store: ReturnType<typeof createPostgresStore>;
  let db: PGlite;
  let aOrg: string;
  let bOrg: string;

  beforeAll(async () => {
    db = new PGlite();
    await migrate(db);
    store = createPostgresStore(pgliteClient(db), memoryBlobs());
    aOrg = (await store.signIn("a@example.com")).org.id;
    bOrg = (await store.signIn("b@example.com")).org.id;
  });

  it("keeps the table closed to browsers: row level security on, no policy", async () => {
    const t = await db.query("SELECT relrowsecurity FROM pg_class WHERE relname = 'billing_events'");
    expect(t.rows[0]).toMatchObject({ relrowsecurity: true });
    const policies = await db.query("SELECT 1 FROM pg_policies WHERE tablename = 'billing_events'");
    expect(policies.rows).toHaveLength(0);
  });

  it("records events and separates what needs a person from what is done", async () => {
    await store.recordBillingEvent({ kind: "payment", paymentId: "pay_1", orgId: aOrg, credits: 150, outcome: "credited", detail: "pack:15" });
    await store.recordBillingEvent({ kind: "payment", paymentId: "pay_2", orgId: null, credits: 0, outcome: "unknown_org", detail: "pack:15" });
    await store.recordBillingEvent({ kind: "refund", paymentId: "pay_1", orgId: null, credits: 0, outcome: "manual_review", detail: "refund.created" });
    await store.recordBillingEvent({ kind: "admin_adjustment", paymentId: null, orgId: bOrg, credits: 5, outcome: "adjusted", detail: "owner@example.com: courtesy" });

    const all = await store.listBillingEvents(50);
    expect(all).toHaveLength(4);
    const pending = await store.listBillingEvents(50, true);
    expect(pending.map((e) => e.outcome).sort()).toEqual(["manual_review", "unknown_org"]);
    expect(all.filter(billingNeedsAttention)).toHaveLength(2);
    expect(await store.listBillingEvents(2)).toHaveLength(2);
  });

  it("summarises the whole platform", async () => {
    const s = await store.adminSummary();
    expect(s).toMatchObject({ workspaces: 2, users: 2, models: 0, paymentsCredited: 1, needsAttention: 2 });
  });

  it("resolves what waited on a payment, once", async () => {
    expect(await store.resolveBillingEvents("pay_1")).toBe(1);
    expect(await store.resolveBillingEvents("pay_1")).toBe(0);
    const pending = await store.listBillingEvents(50, true);
    expect(pending.map((e) => e.outcome)).toEqual(["unknown_org"]);
    expect((await store.adminSummary()).needsAttention).toBe(1);
  });

  it("lists workspaces with email, balance and model count", async () => {
    await store.adjustBalance(bOrg, 40, "adjustment", "t-1");
    const rows = await store.adminWorkspaces();
    expect(rows).toHaveLength(2);
    const b = rows.find((r) => r.orgId === bOrg)!;
    const usage = await store.usage(bOrg);
    expect(b).toMatchObject({ email: "b@example.com", models: 0 });
    expect(b.balance).toBe(usage.balance);
    expect(rows.find((r) => r.orgId === aOrg)?.email).toBe("a@example.com");
    expect(rows.every((r) => typeof r.createdAt === "string")).toBe(true);
  });
});
