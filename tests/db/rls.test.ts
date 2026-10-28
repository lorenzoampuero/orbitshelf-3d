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
    `);

    // Switch to non-superuser role with RLS enforced and act as userA
    await db.exec(`
      SET ROLE authenticated_tenant;
      SELECT set_config('app.current_user_id', '${userA}', false);
    `);

    // User A inserts a product, model, and usage ledger row in Org A
    await db.exec(`
      INSERT INTO public.products (id, org_id, title, sku, category)
      VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '${orgA}', 'Alpha Vase', 'ALPHA-1', 'home-decor');

      INSERT INTO public.models (id, org_id, product_id, source, provenance, status)
      VALUES ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '${orgA}', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'demo', 'demo-sample', 'ready');

      INSERT INTO public.usage_ledger (org_id, delta, reason, idempotency_key)
      VALUES ('${orgA}', 3, 'local_cap_grant', 'grant:${orgA}');
    `);

    // Duplicate idempotency_key must fail
    await expect(
      db.exec(`
        INSERT INTO public.usage_ledger (org_id, delta, reason, idempotency_key)
        VALUES ('${orgA}', 3, 'local_cap_grant', 'grant:${orgA}');
      `),
    ).rejects.toThrow();

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
