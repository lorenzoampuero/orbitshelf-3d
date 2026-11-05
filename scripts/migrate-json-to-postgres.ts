/**
 * Copies the local JSON store and its files into the production database and bucket.
 *
 *   npx tsx scripts/migrate-json-to-postgres.ts            # dry run: only reports what it would copy
 *   npx tsx scripts/migrate-json-to-postgres.ts --apply    # copies. Safe to run twice: existing rows are left alone.
 *
 * Reads DATABASE_URL, SUPABASE_URL, SUPABASE_SECRET_KEY and DATA_DIR from the environment.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

type Json = Record<string, never> & Record<string, unknown>;

const apply = process.argv.includes("--apply");
const dataDir = path.resolve(process.env.DATA_DIR || ".data");
const dbFile = path.join(dataDir, "db.json");

const mapJobState: Record<string, string> = { pending: "queued", success: "succeeded", error: "failed" };

async function main() {
  if (!existsSync(dbFile)) throw new Error(`Nothing to migrate: ${dbFile} does not exist.`);
  const db = JSON.parse(readFileSync(dbFile, "utf8")) as { orgs: Json[]; users: Json[]; models: Json[]; ledger: Json[]; jobEvents?: Json[]; costEvents?: Json[] };
  console.log(`Found ${db.orgs.length} workspaces, ${db.users.length} users, ${db.models.length} models, ${db.ledger.length} ledger rows in ${dbFile}.`);

  const files: { key: string; file: string; mime: string }[] = [];
  for (const m of db.models) {
    const org = String(m.orgId);
    const id = String(m.id);
    const add = (key: string, mime: string) => {
      const file = path.join(dataDir, ...key.split("/"));
      if (existsSync(file)) files.push({ key, file, mime });
    };
    add(`files/${org}/${id}.glb`, "model/gltf-binary");
    if (m.sourceImageExt) add(`uploads/${org}/${id}.${m.sourceImageExt}`, m.sourceImageExt === "jpg" ? "image/jpeg" : "image/png");
    for (const e of (m.extraImages as { view: string; ext: string }[] | undefined) ?? []) add(`uploads/${org}/${id}.${e.view}.${e.ext}`, e.ext === "jpg" ? "image/jpeg" : "image/png");
  }
  console.log(`Found ${files.length} files to copy.`);
  if (!apply) {
    console.log("Dry run: nothing was changed. Run again with --apply to copy.");
    return;
  }

  const url = process.env.DATABASE_URL;
  const storageUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const secret = process.env.SUPABASE_SECRET_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "orbitshelf-private";
  if (!url || !storageUrl || !secret) throw new Error("Set DATABASE_URL, SUPABASE_URL and SUPABASE_SECRET_KEY first.");

  for (const f of files) {
    const res = await fetch(`${storageUrl}/storage/v1/object/${bucket}/${f.key}`, {
      method: "POST",
      headers: { apikey: secret, Authorization: `Bearer ${secret}`, "Content-Type": f.mime, "x-upsert": "true" },
      body: new Uint8Array(readFileSync(f.file)),
    });
    if (!res.ok) throw new Error(`Upload failed for ${f.key}: HTTP ${res.status}`);
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query("BEGIN");
    for (const o of db.orgs) await client.query("INSERT INTO public.organizations (id, name, created_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [o.id, o.name, o.createdAt]);
    for (const u of db.users) await client.query("INSERT INTO public.app_users (id, email, org_id, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING", [u.id, u.email, u.orgId, u.createdAt]);
    for (const m of db.models) {
      const source = m.source === "sloyd" ? "ai" : m.source;
      const dims = (m.dimensions ?? {}) as { widthMm?: number; heightMm?: number; depthMm?: number };
      await client.query(
        `INSERT INTO public.models (id, org_id, title, sku, category, source, provenance, engine_id, estimated_cost_usd, input_kind, source_views, prompt, demo_asset, status, job_state,
           provider_job_ref, provider_job_id, provider_job_urls, idempotency_key, error, failure_code, attempts_debited, attempts_refunded, provider_credits_estimate, texture_resolution,
           review_state, checklist, review_note, reviewed_at, width_mm, height_mm, depth_mm, file_size, checksum, stalled, rights_affirmed, has_source_image, source_image_ext, extra_images,
           source_image_sha256, next_poll_at, poll_count, last_polled_at, last_poll_error, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46)
         ON CONFLICT DO NOTHING`,
        [
          m.id, m.orgId, m.title, m.sku ?? null, m.category, source, m.provenance, m.engineId ?? (source === "ai" ? "sloyd" : null), m.estimatedCostUsd ?? null, m.inputKind ?? (source === "ai" ? "image" : null),
          m.sourceViews ?? (m.hasSourceImage ? ["front"] : []), m.prompt ?? null, m.demoAsset ?? null, m.status, mapJobState[String(m.jobState)] ?? m.jobState,
          m.providerJobRef ?? null, m.providerJobId ?? null, m.providerJobUrls ? JSON.stringify(m.providerJobUrls) : null, m.idempotencyKey ?? null, m.error ?? null, m.failureCode ?? null,
          m.attemptsDebited ?? 0, m.attemptsRefunded ?? 0, m.providerCreditsEstimate ?? 0, m.textureResolution ?? null,
          m.reviewState, JSON.stringify(m.checklist), m.reviewNote ?? null, m.reviewedAt ?? null, dims.widthMm ?? null, dims.heightMm ?? null, dims.depthMm ?? null, m.fileSize ?? null, m.checksum ?? null,
          Boolean(m.stalled), Boolean(m.rightsAffirmed), Boolean(m.hasSourceImage), m.sourceImageExt ?? null, JSON.stringify(m.extraImages ?? []),
          m.sourceImageSha256 ?? null, m.nextPollAt ?? null, m.pollCount ?? 0, m.lastPolledAt ?? null, m.lastPollError ?? null, m.createdAt, m.updatedAt,
        ],
      );
    }
    for (const l of db.ledger) {
      await client.query(
        "INSERT INTO public.usage_ledger (id, org_id, model_id, delta, reason, idempotency_key, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING",
        [l.id, l.orgId, l.modelId ?? null, l.delta, l.reason, l.idempotencyKey, l.createdAt],
      );
    }
    for (const e of db.jobEvents ?? []) {
      await client.query("INSERT INTO public.job_events (id, org_id, model_id, state, detail, created_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING", [e.id, e.orgId, e.modelId, e.state, e.detail ?? null, e.at]);
    }
    for (const c of db.costEvents ?? []) {
      await client.query("INSERT INTO public.provider_cost_events (id, org_id, model_id, engine_id, usd, evidence, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING", [c.id, c.orgId, c.modelId, c.engineId, c.usd, c.evidence, c.at]);
    }
    await client.query("COMMIT");
    console.log("Done. Check the counts in the database before removing the local files.");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
