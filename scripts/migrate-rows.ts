import { existsSync } from "node:fs";
import path from "node:path";

/** What the JSON store holds. Tables added after a file was written can be missing, so every list but the first four is optional. */
type Row = Record<string, unknown>;
export type LocalData = {
  orgs: Row[];
  users: Row[];
  models: Row[];
  ledger: Row[];
  audit?: Row[];
  jobEvents?: Row[];
  costEvents?: Row[];
  versions?: Row[];
  projects?: Row[];
  embeds?: Row[];
  integrations?: Row[];
  publications?: Row[];
  apiTokens?: Row[];
  webhookEndpoints?: Row[];
  webhookDeliveries?: Row[];
};

type Sql = { query(text: string, params?: unknown[]): Promise<unknown> };

const mapJobState: Record<string, string> = { pending: "queued", success: "succeeded", error: "failed" };
const imageMime = (ext: unknown) => (ext === "jpg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png");

export function filesToCopy(db: LocalData, dataDir: string) {
  const files: { key: string; file: string; mime: string }[] = [];
  const add = (key: string, mime: string) => {
    const file = path.join(dataDir, ...key.split("/"));
    if (existsSync(file)) files.push({ key, file, mime });
  };
  for (const m of db.models) {
    const org = String(m.orgId);
    const id = String(m.id);
    add(`files/${org}/${id}.glb`, "model/gltf-binary");
    if (m.sourceImageExt) add(`uploads/${org}/${id}.${m.sourceImageExt}`, imageMime(m.sourceImageExt));
    for (const e of (m.extraImages as { view: string; ext: string }[] | undefined) ?? []) add(`uploads/${org}/${id}.${e.view}.${e.ext}`, imageMime(e.ext));
    if (m.thumbnailExt) add(`thumbs/${org}/${id}.${m.thumbnailExt}`, imageMime(m.thumbnailExt));
  }
  for (const v of db.versions ?? []) add(`files/${String(v.orgId)}/${String(v.modelId)}.${String(v.id)}.glb`, "model/gltf-binary");
  return files;
}

/** Every statement ignores rows that already exist, so running it twice is safe. Order follows the foreign keys. */
export async function copyRows(db: LocalData, sql: Sql) {
  for (const o of db.orgs) await sql.query("INSERT INTO public.organizations (id, name, created_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [o.id, o.name, o.createdAt]);
  for (const u of db.users) {
    const p = (u.profile ?? {}) as Row;
    await sql.query(
      `INSERT INTO public.app_users (id, email, org_id, created_at, use_case, experience, goal, active_workspace, onboarded_at, onboarding_skipped_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT DO NOTHING`,
      [u.id, u.email, u.orgId, u.createdAt, p.useCase ?? null, p.experience ?? null, p.goal ?? null, p.activeWorkspace ?? null, p.onboardedAt ?? null, p.skippedAt ?? null],
    );
  }
  for (const p of db.projects ?? []) await sql.query("INSERT INTO public.projects (id, org_id, name, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING", [p.id, p.orgId, p.name, p.createdAt]);
  for (const m of db.models) {
    const source = m.source === "sloyd" ? "ai" : m.source;
    const dims = (m.dimensions ?? {}) as { widthMm?: number; heightMm?: number; depthMm?: number };
    await sql.query(
      `INSERT INTO public.models (id, org_id, title, sku, category, source, provenance, engine_id, estimated_cost_usd, input_kind, source_views, prompt, demo_asset, status, job_state,
         provider_job_ref, provider_job_id, provider_job_urls, idempotency_key, error, failure_code, attempts_debited, attempts_refunded, provider_credits_estimate, texture_resolution,
         review_state, checklist, review_note, reviewed_at, width_mm, height_mm, depth_mm, file_size, checksum, stalled, rights_affirmed, has_source_image, source_image_ext, extra_images,
         source_image_sha256, next_poll_at, poll_count, last_polled_at, last_poll_error, created_at, updated_at,
         current_version_id, project_id, tags, favorite, has_thumbnail, thumbnail_ext, deleted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51,$52,$53)
       ON CONFLICT DO NOTHING`,
      [
        m.id, m.orgId, m.title, m.sku ?? null, m.category, source, m.provenance, m.engineId ?? (source === "ai" ? "sloyd" : null), m.estimatedCostUsd ?? null, m.inputKind ?? (source === "ai" ? "image" : null),
        m.sourceViews ?? (m.hasSourceImage ? ["front"] : []), m.prompt ?? null, m.demoAsset ?? null, m.status, mapJobState[String(m.jobState)] ?? m.jobState,
        m.providerJobRef ?? null, m.providerJobId ?? null, m.providerJobUrls ? JSON.stringify(m.providerJobUrls) : null, m.idempotencyKey ?? null, m.error ?? null, m.failureCode ?? null,
        m.attemptsDebited ?? 0, m.attemptsRefunded ?? 0, m.providerCreditsEstimate ?? 0, m.textureResolution ?? null,
        m.reviewState, JSON.stringify(m.checklist), m.reviewNote ?? null, m.reviewedAt ?? null, dims.widthMm ?? null, dims.heightMm ?? null, dims.depthMm ?? null, m.fileSize ?? null, m.checksum ?? null,
        Boolean(m.stalled), Boolean(m.rightsAffirmed), Boolean(m.hasSourceImage), m.sourceImageExt ?? null, JSON.stringify(m.extraImages ?? []),
        m.sourceImageSha256 ?? null, m.nextPollAt ?? null, m.pollCount ?? 0, m.lastPolledAt ?? null, m.lastPollError ?? null, m.createdAt, m.updatedAt,
        m.currentVersionId ?? null, m.projectId ?? null, m.tags ?? [], Boolean(m.favorite), Boolean(m.hasThumbnail), m.thumbnailExt ?? null, m.deletedAt ?? null,
      ],
    );
  }
  for (const l of db.ledger) {
    await sql.query("INSERT INTO public.usage_ledger (id, org_id, model_id, delta, reason, idempotency_key, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING", [l.id, l.orgId, l.modelId ?? null, l.delta, l.reason, l.idempotencyKey, l.createdAt]);
  }
  for (const a of db.audit ?? []) {
    await sql.query("INSERT INTO public.audit_log (id, org_id, action, model_id, detail, created_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING", [a.id, a.orgId, a.action, a.modelId ?? null, a.detail ?? null, a.at]);
  }
  for (const e of db.jobEvents ?? []) {
    await sql.query("INSERT INTO public.job_events (id, org_id, model_id, state, detail, created_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING", [e.id, e.orgId, e.modelId, e.state, e.detail ?? null, e.at]);
  }
  for (const c of db.costEvents ?? []) {
    await sql.query("INSERT INTO public.provider_cost_events (id, org_id, model_id, engine_id, usd, evidence, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING", [c.id, c.orgId, c.modelId, c.engineId, c.usd, c.evidence, c.at]);
  }
  for (const v of db.versions ?? []) {
    await sql.query("INSERT INTO public.asset_versions (id, org_id, model_id, preset, bytes, sha256, diagnostics, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING", [v.id, v.orgId, v.modelId, v.preset, v.bytes, v.sha256, JSON.stringify(v.diagnostics), v.createdAt]);
  }
  for (const e of db.embeds ?? []) {
    await sql.query("INSERT INTO public.embeds (id, token, org_id, model_id, allowed_domains, created_at, revoked_at) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING", [e.id, e.token, e.orgId, e.modelId, e.allowedDomains ?? [], e.createdAt, e.revokedAt ?? null]);
  }
  for (const i of db.integrations ?? []) {
    await sql.query(
      "INSERT INTO public.integrations (org_id, provider, shop, access_token_enc, refresh_token_enc, expires_at, scopes, connected_at, revoked_at) VALUES ($1,'shopify',$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING",
      [i.orgId, i.shop, i.accessTokenEnc, i.refreshTokenEnc ?? null, i.expiresAt ?? null, i.scopes, i.connectedAt, i.revokedAt ?? null],
    );
  }
  for (const p of db.publications ?? []) {
    await sql.query(
      "INSERT INTO public.publications (id, org_id, model_id, checksum, shop, product_id, product_title, state, remote_file_id, error, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT DO NOTHING",
      [p.id, p.orgId, p.modelId, p.checksum, p.shop, p.productId, p.productTitle, p.state, p.remoteFileId ?? null, p.error ?? null, p.createdAt, p.updatedAt],
    );
  }
  for (const t of db.apiTokens ?? []) {
    await sql.query("INSERT INTO public.api_tokens (id, org_id, name, token_hash, prefix, scopes, created_at, last_used_at, revoked_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING", [t.id, t.orgId, t.name, t.tokenHash, t.prefix, t.scopes, t.createdAt, t.lastUsedAt ?? null, t.revokedAt ?? null]);
  }
  for (const e of db.webhookEndpoints ?? []) {
    await sql.query("INSERT INTO public.webhook_endpoints (id, org_id, url, secret_enc, created_at, disabled_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING", [e.id, e.orgId, e.url, e.secretEnc, e.createdAt, e.disabledAt ?? null]);
  }
  for (const d of db.webhookDeliveries ?? []) {
    await sql.query(
      "INSERT INTO public.webhook_deliveries (id, endpoint_id, org_id, event, dedupe_key, payload, attempts, next_attempt_at, delivered_at, last_status, last_error, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT DO NOTHING",
      [d.id, d.endpointId, d.orgId, d.event, d.dedupeKey, d.payload, d.attempts, d.nextAttemptAt ?? null, d.deliveredAt ?? null, d.lastStatus ?? null, d.lastError ?? null, d.createdAt],
    );
  }
}
