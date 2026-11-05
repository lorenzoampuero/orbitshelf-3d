import { beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { migrate } from "./sql-client";

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const MODEL_A = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const MODEL_B = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

const modelInsert = (id: string, org: string) => `
  INSERT INTO public.models (id, org_id, title, category, source, provenance, status, job_state, checklist, created_at, updated_at)
  VALUES ('${id}', '${org}', 'Vase', 'home-decor', 'demo', 'demo-sample', 'ready', 'succeeded', '{}', now(), now());`;

describe("Row Level Security (PGlite)", () => {
  let db: PGlite;
  const asUser = (id: string | null) => db.exec(`SET ROLE authenticated_tenant; SELECT set_config('app.current_user_id', '${id ?? ""}', false);`);
  const count = async (table: string) => (await db.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM public.${table}`)).rows[0].n;

  beforeAll(async () => {
    db = new PGlite();
    await migrate(db);
    await db.exec(`
      INSERT INTO public.organizations (id, name) VALUES ('org_a', 'A'), ('org_b', 'B');
      INSERT INTO public.app_users (id, email, org_id) VALUES ('usr_a', 'a@x.test', 'org_a'), ('usr_b', 'b@x.test', 'org_b');
      INSERT INTO public.memberships (org_id, auth_user_id) VALUES ('org_a', '${USER_A}'), ('org_b', '${USER_B}');
      ${modelInsert(MODEL_A, "org_a")}
      ${modelInsert(MODEL_B, "org_b")}
      INSERT INTO public.usage_ledger (id, org_id, delta, reason, idempotency_key, created_at)
        VALUES (gen_random_uuid(), 'org_a', 3, 'local_cap_grant', 'grant:initial', now()), (gen_random_uuid(), 'org_b', 3, 'local_cap_grant', 'grant:initial', now());
      INSERT INTO public.provider_cost_events (id, org_id, model_id, engine_id, usd, evidence, created_at)
        VALUES (gen_random_uuid(), 'org_a', '${MODEL_A}', 'sloyd', 0.27, 'published', now());
      INSERT INTO public.engine_switches (engine_id) VALUES ('sloyd');
      INSERT INTO public.rate_limits VALUES ('k', 1, 1);
    `);
  });

  it("a member reads only their own organization", async () => {
    await asUser(USER_A);
    expect((await db.query<{ id: string }>("SELECT id FROM public.models")).rows.map((r) => r.id)).toEqual([MODEL_A]);
    expect((await db.query<{ id: string }>("SELECT id FROM public.organizations")).rows.map((r) => r.id)).toEqual(["org_a"]);
    expect(await count("usage_ledger")).toBe(1);
    await db.exec("RESET ROLE");
  });

  it("an unauthenticated connection reads nothing", async () => {
    await asUser(null);
    for (const t of ["organizations", "app_users", "memberships", "models", "usage_ledger", "job_events"]) expect(await count(t)).toBe(0);
    await db.exec("RESET ROLE");
  });

  it("internal costs, audit data, engine switches and limits are not readable by customers", async () => {
    await asUser(USER_A);
    for (const t of ["provider_cost_events", "audit_log", "engine_switches", "rate_limits"]) expect(await count(t)).toBe(0);
    await db.exec("RESET ROLE");
  });

  it("a member cannot change a model's status or origin, grant attempts, or create a membership", async () => {
    await asUser(USER_A);
    const attempts = [
      `UPDATE public.models SET provenance = 'ai-generated', status = 'ready', review_state = 'approved' WHERE id = '${MODEL_A}'`,
      `DELETE FROM public.models WHERE id = '${MODEL_A}'`,
      modelInsert("ffffffff-ffff-4fff-8fff-ffffffffffff", "org_a"),
      `INSERT INTO public.usage_ledger (id, org_id, delta, reason, idempotency_key, created_at) VALUES (gen_random_uuid(), 'org_a', 999, 'local_cap_grant', 'x', now())`,
      `INSERT INTO public.memberships (org_id, auth_user_id) VALUES ('org_b', '${USER_A}')`,
    ];
    for (const a of attempts) await expect(db.exec(a)).rejects.toThrow(/permission denied|row-level security/i);
    await db.exec("RESET ROLE");
    const row = (await db.query<{ review_state: string }>(`SELECT review_state FROM public.models WHERE id = '${MODEL_A}'`)).rows[0];
    expect(row.review_state).toBe("pending");
  });

  it("the ledger refuses a repeated idempotency key", async () => {
    await expect(
      db.exec(`INSERT INTO public.usage_ledger (id, org_id, delta, reason, idempotency_key, created_at) VALUES (gen_random_uuid(), 'org_a', 3, 'local_cap_grant', 'grant:initial', now())`),
    ).rejects.toThrow(/duplicate key/i);
  });

  it("a model's checks reject values the app never writes", async () => {
    await expect(db.exec(`UPDATE public.models SET job_state = 'made_up' WHERE id = '${MODEL_A}'`)).rejects.toThrow(/check constraint/i);
    await expect(db.exec(`UPDATE public.models SET provenance = 'real-scan' WHERE id = '${MODEL_A}'`)).rejects.toThrow(/check constraint/i);
  });
});
