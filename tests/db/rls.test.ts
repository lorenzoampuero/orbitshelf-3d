import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";

describe("Supabase PostgreSQL schema + RLS isolation (PGlite)", () => {
  it("enforces tenant isolation across organizations and idempotent ledger keys", async () => {
    const db = new PGlite();
    const sqlPath = path.join(process.cwd(), "supabase", "migrations", "0001_init.sql");
    const migrationSql = await readFile(sqlPath, "utf8");
    await db.exec(migrationSql);

    const userA = "11111111-1111-4111-8111-111111111111";
    const userB = "22222222-2222-4222-8222-222222222222";
    const orgA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const orgB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

    // Seed two organizations and memberships as superuser
    await db.exec(`
      INSERT INTO public.organizations (id, name, slug) VALUES
        ('${orgA}', 'Org Alpha', 'org-alpha'),
        ('${orgB}', 'Org Beta', 'org-beta');

      INSERT INTO public.memberships (org_id, user_id, role) VALUES
        ('${orgA}', '${userA}', 'owner'),
        ('${orgB}', '${userB}', 'owner');

      -- The attempt ledger is written by the server only
      INSERT INTO public.usage_ledger (org_id, delta, reason, idempotency_key)
      VALUES ('${orgA}', 3, 'local_cap_grant', 'grant:${orgA}');
      INSERT INTO public.plans (id, name, monthly_attempts) VALUES ('starter', 'Starter', 30);
    `);

    // Switch to non-superuser role with RLS enforced and act as userA
    await db.exec(`
      SET ROLE authenticated_tenant;
      SELECT set_config('app.current_user_id', '${userA}', false);
    `);

    // User A inserts a product and model in Org A
    await db.exec(`
      INSERT INTO public.products (id, org_id, title, sku, category)
      VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '${orgA}', 'Alpha Vase', 'ALPHA-1', 'home-decor');

      INSERT INTO public.models (id, org_id, product_id, source, provenance, status)
      VALUES ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '${orgA}', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'demo', 'demo-sample', 'ready');
    `);

    // Members can read but never write their own attempt ledger, subscription or the plan catalogue
    const ledgerForA = await db.query<{ delta: number }>(`SELECT delta FROM public.usage_ledger`);
    expect(ledgerForA.rows).toEqual([{ delta: 3 }]);
    await expect(
      db.exec(`
        INSERT INTO public.usage_ledger (org_id, delta, reason, idempotency_key)
        VALUES ('${orgA}', 999, 'local_cap_grant', 'grant2:${orgA}');
      `),
    ).rejects.toThrow();
    await expect(
      db.exec(`INSERT INTO public.subscriptions (org_id, plan_id, status) VALUES ('${orgA}', 'starter', 'active');`),
    ).rejects.toThrow();
    await expect(db.exec(`INSERT INTO public.plans (id, name, monthly_attempts) VALUES ('free', 'Free', 9999);`)).rejects.toThrow();
    const plans = await db.query(`SELECT id FROM public.plans`);
    expect(plans.rows).toHaveLength(1);

    // User A cannot insert into Org B
    await expect(
      db.exec(`
        INSERT INTO public.products (org_id, title, sku, category)
        VALUES ('${orgB}', 'Intruder Product', 'HACK-1', 'other');
      `),
    ).rejects.toThrow();

    // Switch to User B
    await db.exec(`
      SELECT set_config('app.current_user_id', '${userB}', false);
    `);

    // User B cannot see Org A'sorganizations, products, models, or ledger entries
    const orgsForB = await db.query<{ id: string }>(`SELECT id FROM public.organizations`);
    expect(orgsForB.rows.map((r) => r.id)).toEqual([orgB]);

    const modelsForB = await db.query<{ id: string }>(`SELECT id FROM public.models`);
    expect(modelsForB.rows).toHaveLength(0);

    const ledgerForB = await db.query<{ id: string }>(`SELECT id FROM public.usage_ledger`);
    expect(ledgerForB.rows).toHaveLength(0);

    // User B cannot update or delete User A's model
    const delResult = await db.query(
      `DELETE FROM public.models WHERE id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' RETURNING id`,
    );
    expect(delResult.rows).toHaveLength(0);

    await db.close();
  });
});

describe("migration 0002: input kinds, views and new categories (PGlite)", () => {
  it("accepts apparel/footwear, ties prompts to text jobs and limits photo views", async () => {
    const db = new PGlite();
    for (const file of ["0001_init.sql", "0002_input_kinds.sql"]) {
      await db.exec(await readFile(path.join(process.cwd(), "supabase", "migrations", file), "utf8"));
    }
    const org = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    await db.exec(`INSERT INTO public.organizations (id, name, slug) VALUES ('${org}', 'Org', 'org');`);

    // New categories work, unknown ones are still refused
    await db.exec(`INSERT INTO public.products (org_id, title, category) VALUES ('${org}', 'Hoodie', 'apparel'), ('${org}', 'Sneaker', 'footwear');`);
    await expect(db.exec(`INSERT INTO public.products (org_id, title, category) VALUES ('${org}', 'X', 'weapons');`)).rejects.toThrow();

    // Jobs: a text job needs a prompt, a photo job must not carry one
    await db.exec(`INSERT INTO public.asset_jobs (org_id, provider, state, input_kind, prompt) VALUES ('${org}', 'sloyd', 'pending', 'text', 'a low-poly red fox sitting');`);
    await db.exec(`INSERT INTO public.asset_jobs (org_id, provider, state, input_kind) VALUES ('${org}', 'sloyd', 'pending', 'multi-image');`);
    await db.exec(`INSERT INTO public.asset_jobs (org_id, provider, state) VALUES ('${org}', 'demo', 'success');`); // demo: no input kind
    await expect(db.exec(`INSERT INTO public.asset_jobs (org_id, provider, state, input_kind) VALUES ('${org}', 'sloyd', 'pending', 'text');`)).rejects.toThrow();
    await expect(
      db.exec(`INSERT INTO public.asset_jobs (org_id, provider, state, input_kind, prompt) VALUES ('${org}', 'sloyd', 'pending', 'image', 'should not be here');`),
    ).rejects.toThrow();
    await expect(db.exec(`INSERT INTO public.asset_jobs (org_id, provider, state, input_kind, prompt) VALUES ('${org}', 'sloyd', 'pending', 'text', 'short');`)).rejects.toThrow();
    await expect(db.exec(`INSERT INTO public.asset_jobs (org_id, provider, state, input_kind) VALUES ('${org}', 'sloyd', 'pending', 'video');`)).rejects.toThrow();

    // Uploads: default view is front; only the four known views are allowed
    const sha = "a".repeat(64);
    await db.exec(`INSERT INTO public.asset_uploads (org_id, storage_key, mime_type, width_px, height_px, sha256) VALUES ('${org}', 'k1', 'image/jpeg', 512, 512, '${sha}');`);
    const views = await db.query<{ view: string }>(`SELECT view FROM public.asset_uploads`);
    expect(views.rows).toEqual([{ view: "front" }]);
    await db.exec(`INSERT INTO public.asset_uploads (org_id, storage_key, mime_type, width_px, height_px, sha256, view) VALUES ('${org}', 'k2', 'image/jpeg', 512, 512, '${sha}', 'back');`);
    await expect(
      db.exec(`INSERT INTO public.asset_uploads (org_id, storage_key, mime_type, width_px, height_px, sha256, view) VALUES ('${org}', 'k3', 'image/jpeg', 512, 512, '${sha}', 'top');`),
    ).rejects.toThrow();

    await db.close();
  });
});
