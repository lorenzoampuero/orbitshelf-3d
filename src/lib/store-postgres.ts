import "server-only";
import { randomUUID } from "node:crypto";
import { blobStoreFromEnv, type BlobStore } from "@/lib/blob";
import { maxActiveJobs, paidAttemptCap } from "@/lib/env";
import { pgClient, type Queryable, type SqlClient, type SqlRow } from "@/lib/sql";
import { assertSafeId, glbKey, mimeOf, nowIso, orgIdForEmail, sourceKey, type CostEventRow, type ExtraImage, type ModelRow, type OrgRow, type SourcePhoto, type UserRow } from "@/lib/store-shared";
import type { Store } from "@/lib/store-local";
import type { FailureCode, ImageView, JobEventDto, JobState, LedgerEntryDto, PriceEvidence, UsageDto } from "@/lib/types";

/* ───────── row mapping ───────── */

const COLUMNS = {
  id: "id",
  orgId: "org_id",
  title: "title",
  sku: "sku",
  category: "category",
  source: "source",
  provenance: "provenance",
  engineId: "engine_id",
  estimatedCostUsd: "estimated_cost_usd",
  inputKind: "input_kind",
  sourceViews: "source_views",
  prompt: "prompt",
  demoAsset: "demo_asset",
  status: "status",
  jobState: "job_state",
  providerJobRef: "provider_job_ref",
  providerJobId: "provider_job_id",
  providerJobUrls: "provider_job_urls",
  idempotencyKey: "idempotency_key",
  error: "error",
  failureCode: "failure_code",
  attemptsDebited: "attempts_debited",
  attemptsRefunded: "attempts_refunded",
  providerCreditsEstimate: "provider_credits_estimate",
  textureResolution: "texture_resolution",
  reviewState: "review_state",
  checklist: "checklist",
  reviewNote: "review_note",
  reviewedAt: "reviewed_at",
  fileSize: "file_size",
  checksum: "checksum",
  stalled: "stalled",
  rightsAffirmed: "rights_affirmed",
  hasSourceImage: "has_source_image",
  sourceImageExt: "source_image_ext",
  extraImages: "extra_images",
  sourceImageSha256: "source_image_sha256",
  nextPollAt: "next_poll_at",
  pollCount: "poll_count",
  lastPolledAt: "last_polled_at",
  lastPollError: "last_poll_error",
  createdAt: "created_at",
  updatedAt: "updated_at",
} as const satisfies Partial<Record<keyof ModelRow, string>>;

const JSON_COLUMNS = new Set(["provider_job_urls", "checklist", "extra_images"]);
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v == null ? null : new Date(String(v)).toISOString());

function fromRow(r: SqlRow): ModelRow {
  const parse = <T>(v: unknown): T => (typeof v === "string" ? (JSON.parse(v) as T) : (v as T));
  return {
    id: String(r.id),
    orgId: String(r.org_id),
    title: r.title as string,
    sku: (r.sku as string | null) ?? null,
    category: r.category as ModelRow["category"],
    source: r.source as ModelRow["source"],
    provenance: r.provenance as ModelRow["provenance"],
    engineId: (r.engine_id as string | null) ?? null,
    estimatedCostUsd: r.estimated_cost_usd == null ? null : Number(r.estimated_cost_usd),
    inputKind: (r.input_kind as ModelRow["inputKind"]) ?? null,
    sourceViews: (r.source_views as ImageView[] | null) ?? [],
    prompt: (r.prompt as string | null) ?? null,
    demoAsset: (r.demo_asset as ModelRow["demoAsset"]) ?? null,
    status: r.status as ModelRow["status"],
    jobState: r.job_state as JobState,
    providerJobRef: (r.provider_job_ref as string | null) ?? null,
    providerJobId: (r.provider_job_id as string | null) ?? null,
    providerJobUrls: parse<ModelRow["providerJobUrls"]>(r.provider_job_urls) ?? null,
    idempotencyKey: (r.idempotency_key as string | null) ?? null,
    error: (r.error as string | null) ?? null,
    failureCode: (r.failure_code as FailureCode | null) ?? null,
    attemptsDebited: Number(r.attempts_debited),
    attemptsRefunded: Number(r.attempts_refunded),
    providerCreditsEstimate: Number(r.provider_credits_estimate),
    textureResolution: (r.texture_resolution as ModelRow["textureResolution"]) ?? null,
    reviewState: r.review_state as ModelRow["reviewState"],
    checklist: parse<ModelRow["checklist"]>(r.checklist),
    reviewNote: (r.review_note as string | null) ?? null,
    reviewedAt: iso(r.reviewed_at),
    dimensions: { widthMm: r.width_mm == null ? null : Number(r.width_mm), heightMm: r.height_mm == null ? null : Number(r.height_mm), depthMm: r.depth_mm == null ? null : Number(r.depth_mm) },
    fileSize: r.file_size == null ? null : Number(r.file_size),
    checksum: (r.checksum as string | null) ?? null,
    stalled: Boolean(r.stalled),
    rightsAffirmed: Boolean(r.rights_affirmed),
    hasSourceImage: Boolean(r.has_source_image),
    sourceImageExt: (r.source_image_ext as ModelRow["sourceImageExt"]) ?? null,
    extraImages: parse<ExtraImage[]>(r.extra_images) ?? [],
    sourceImageSha256: (r.source_image_sha256 as string | null) ?? null,
    nextPollAt: iso(r.next_poll_at),
    pollCount: Number(r.poll_count),
    lastPolledAt: iso(r.last_polled_at),
    lastPollError: (r.last_poll_error as string | null) ?? null,
    createdAt: iso(r.created_at)!,
    updatedAt: iso(r.updated_at)!,
  };
}

/** Turns a partial model into columns and values. Unknown keys cannot reach the SQL text: columns come from the map above. */
function toColumns(patch: Partial<ModelRow>): { columns: string[]; values: unknown[] } {
  const columns: string[] = [];
  const values: unknown[] = [];
  for (const [key, column] of Object.entries(COLUMNS)) {
    if (!(key in patch)) continue;
    const value = patch[key as keyof ModelRow];
    columns.push(column);
    values.push(JSON_COLUMNS.has(column) ? (value == null ? null : JSON.stringify(value)) : (value ?? null));
  }
  if (patch.dimensions) {
    columns.push("width_mm", "height_mm", "depth_mm");
    values.push(patch.dimensions.widthMm, patch.dimensions.heightMm, patch.dimensions.depthMm);
  }
  return { columns, values };
}

const asUuid = (id: string) => (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id : null);

/* ───────── helpers shared by transactions ───────── */

async function lockOrg(tx: Queryable, orgId: string) {
  await tx.query("SELECT id FROM public.organizations WHERE id = $1 FOR UPDATE", [orgId]);
}

async function pushLedger(tx: Queryable, row: { orgId: string; idempotencyKey: string; delta: number; reason: LedgerEntryDto["reason"]; modelId: string | null }): Promise<boolean> {
  const res = await tx.query(
    `INSERT INTO public.usage_ledger (id, org_id, model_id, delta, reason, idempotency_key, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (org_id, idempotency_key) DO NOTHING RETURNING id`,
    [randomUUID(), row.orgId, row.modelId, row.delta, row.reason, row.idempotencyKey, nowIso()],
  );
  return res.rows.length > 0;
}

const audit = (tx: Queryable, orgId: string, action: string, modelId: string | null, detail?: string) =>
  tx.query("INSERT INTO public.audit_log (id, org_id, action, model_id, detail, created_at) VALUES ($1, $2, $3, $4, $5, $6)", [randomUUID(), orgId, action, modelId, detail ?? null, nowIso()]);

const jobEvent = (tx: Queryable, orgId: string, modelId: string, state: JobState, detail: string | null = null) =>
  tx.query("INSERT INTO public.job_events (id, org_id, model_id, state, detail, created_at) VALUES ($1, $2, $3, $4, $5, $6)", [randomUUID(), orgId, modelId, state, detail, nowIso()]);

async function balanceOf(tx: Queryable, orgId: string): Promise<number> {
  const res = await tx.query<{ n: unknown }>("SELECT COALESCE(SUM(delta), 0) AS n FROM public.usage_ledger WHERE org_id = $1", [orgId]);
  return Number(res.rows[0].n);
}

async function activeJobsOf(tx: Queryable, orgId: string): Promise<number> {
  const res = await tx.query<{ n: unknown }>("SELECT COUNT(*) AS n FROM public.models WHERE org_id = $1 AND source = 'ai' AND status = 'processing' AND NOT stalled", [orgId]);
  return Number(res.rows[0].n);
}

async function selectForUpdate(tx: Queryable, orgId: string, id: string): Promise<ModelRow | null> {
  if (!asUuid(id)) return null;
  const res = await tx.query("SELECT * FROM public.models WHERE org_id = $1 AND id = $2 FOR UPDATE", [orgId, id]);
  return res.rows[0] ? fromRow(res.rows[0]) : null;
}

async function applyPatch(tx: Queryable, orgId: string, id: string, patch: Partial<ModelRow>): Promise<ModelRow | null> {
  const { columns, values } = toColumns({ ...patch, updatedAt: nowIso() });
  const sets = columns.map((c, i) => `${c} = $${i + 3}`).join(", ");
  const res = await tx.query(`UPDATE public.models SET ${sets} WHERE org_id = $1 AND id = $2 RETURNING *`, [orgId, id, ...values]);
  return res.rows[0] ? fromRow(res.rows[0]) : null;
}

/* ───────── store ───────── */

const LEASE_SECONDS = 90;

export function createPostgresStore(sql: SqlClient, blobs: BlobStore): Store {
  const store: Store = {
    /** Creates (or returns) the user and workspace for an email, granting the safety cap once. With a Supabase user id, also records the membership RLS relies on. */
    async signIn(email: string, authUserId?: string | null) {
      const clean = email.trim().toLowerCase();
      const orgId = orgIdForEmail(clean);
      return sql.transaction(async (tx) => {
        const inserted = await tx.query("INSERT INTO public.organizations (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING RETURNING id", [orgId, (clean.split("@")[0] || "Workspace").slice(0, 120)]);
        if (inserted.rows.length > 0) {
          await pushLedger(tx, { orgId, idempotencyKey: "grant:initial", delta: paidAttemptCap(), reason: "local_cap_grant", modelId: null }).catch(async (e) => {
            throw e;
          });
          await audit(tx, orgId, "org.created", null);
        }
        const userId = "usr_" + orgId.slice(4, 20);
        await tx.query("INSERT INTO public.app_users (id, email, org_id) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING", [userId, clean, orgId]);
        if (authUserId) await tx.query("INSERT INTO public.memberships (org_id, auth_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [orgId, authUserId]);
        const u = (await tx.query("SELECT id, email, org_id, created_at FROM public.app_users WHERE email = $1", [clean])).rows[0];
        const o = (await tx.query("SELECT id, name, created_at FROM public.organizations WHERE id = $1", [orgId])).rows[0];
        const user: UserRow = { id: String(u.id), email: String(u.email), orgId: String(u.org_id), createdAt: iso(u.created_at)! };
        const org: OrgRow = { id: String(o.id), name: String(o.name), createdAt: iso(o.created_at)! };
        return { user, org };
      });
    },

    async getOrg(orgId) {
      const o = (await sql.query("SELECT id, name, created_at FROM public.organizations WHERE id = $1", [orgId])).rows[0];
      return o ? { id: String(o.id), name: String(o.name), createdAt: iso(o.created_at)! } : null;
    },

    async listModels(orgId) {
      return (await sql.query("SELECT * FROM public.models WHERE org_id = $1 ORDER BY created_at DESC", [orgId])).rows.map(fromRow);
    },

    /** Every read is scoped by organisation: another tenant's id simply does not exist. */
    async getModel(orgId, id) {
      if (!asUuid(id)) return null;
      const r = (await sql.query("SELECT * FROM public.models WHERE org_id = $1 AND id = $2", [orgId, id])).rows[0];
      return r ? fromRow(r) : null;
    },

    async insertDemoModel(orgId, row, glb) {
      assertSafeId(row.id);
      await blobs.put(glbKey(orgId, row.id), glb, "model/gltf-binary");
      return sql.transaction(async (tx) => {
        await insertModel(tx, row);
        await audit(tx, orgId, "model.created.demo", row.id);
        return row;
      });
    },

    /**
     * Atomically: lock the organization → idempotency lookup → concurrency cap → balance check → ledger debit → model row.
     * The lock serialises reservations per organization, so two simultaneous requests cannot both spend the last attempt.
     * Photos are stored after the commit, so a slow upload never holds the lock.
     */
    async reserveProviderJob(orgId, row, photos: SourcePhoto[]) {
      assertSafeId(row.id);
      const reserved = await sql.transaction(async (tx) => {
        await lockOrg(tx, orgId);
        if (row.idempotencyKey) {
          const dup = (await tx.query("SELECT * FROM public.models WHERE org_id = $1 AND idempotency_key = $2", [orgId, row.idempotencyKey])).rows[0];
          if (dup) return { ok: true as const, duplicate: true as const, model: fromRow(dup) };
        }
        if ((await activeJobsOf(tx, orgId)) >= maxActiveJobs()) return { ok: false as const, reason: "too_many_active" as const };
        if ((await balanceOf(tx, orgId)) < 1) return { ok: false as const, reason: "insufficient" as const };
        await pushLedger(tx, { orgId, idempotencyKey: `debit:${row.id}`, delta: -1, reason: "job_debit", modelId: row.id });
        const model = { ...row, attemptsDebited: 1 };
        await insertModel(tx, model);
        await jobEvent(tx, orgId, row.id, "reserved");
        await audit(tx, orgId, "job.reserved", row.id);
        return { ok: true as const, duplicate: false as const, model };
      });
      if (reserved.ok && !reserved.duplicate) {
        await Promise.all(photos.map((p) => blobs.put(sourceKey(orgId, row.id, p.ext, p.view), p.buffer, mimeOf(p.ext))));
      }
      return reserved;
    },

    async updateModel(orgId, id, patch) {
      return sql.transaction(async (tx) => {
        const m = await selectForUpdate(tx, orgId, id);
        if (!m) return null;
        if (patch.jobState && patch.jobState !== m.jobState) await jobEvent(tx, orgId, id, patch.jobState);
        return applyPatch(tx, orgId, id, patch);
      });
    },

    /** Idempotent refund of the single attempt debited for a model. */
    async refundJob(orgId, modelId, why) {
      return sql.transaction(async (tx) => {
        const m = await selectForUpdate(tx, orgId, modelId);
        if (!m) return false;
        const debit = await tx.query("SELECT id FROM public.usage_ledger WHERE org_id = $1 AND idempotency_key = $2", [orgId, `debit:${modelId}`]);
        if (debit.rows.length === 0) return false;
        const created = await pushLedger(tx, { orgId, idempotencyKey: `refund:${modelId}`, delta: 1, reason: "job_refund", modelId });
        if (created) {
          await applyPatch(tx, orgId, modelId, { attemptsRefunded: m.attemptsRefunded + 1 });
          await audit(tx, orgId, "job.refunded", modelId, why);
        }
        return created;
      });
    },

    async markFailed(orgId, modelId, input) {
      return sql.transaction(async (tx) => {
        const m = await selectForUpdate(tx, orgId, modelId);
        if (!m) return null;
        if (m.status !== "processing") return m; // never overwrite a finished model
        const jobState: JobState = input.failureCode === "ambiguous" || input.failureCode === "invalid_output" ? "needs_review" : "failed";
        await jobEvent(tx, orgId, modelId, jobState, input.failureCode);
        let attemptsRefunded = m.attemptsRefunded;
        if (input.refund) {
          const debit = await tx.query("SELECT id FROM public.usage_ledger WHERE org_id = $1 AND idempotency_key = $2", [orgId, `debit:${modelId}`]);
          if (debit.rows.length > 0 && (await pushLedger(tx, { orgId, idempotencyKey: `refund:${modelId}`, delta: 1, reason: "job_refund", modelId }))) attemptsRefunded += 1;
        }
        await audit(tx, orgId, "job.failed", modelId, input.failureCode);
        return applyPatch(tx, orgId, modelId, { status: "failed", jobState, error: input.error.slice(0, 400), failureCode: input.failureCode, nextPollAt: null, attemptsRefunded });
      });
    },

    async completeJob(orgId, modelId, glb, info) {
      assertSafeId(modelId);
      const current = await store.getModel(orgId, modelId);
      if (!current) return null;
      if (current.status === "ready") return current;
      await blobs.put(glbKey(orgId, modelId), glb, "model/gltf-binary");
      return sql.transaction(async (tx) => {
        const m = await selectForUpdate(tx, orgId, modelId);
        if (!m) return null;
        if (m.status === "ready") return m;
        await jobEvent(tx, orgId, modelId, "succeeded");
        await audit(tx, orgId, "job.completed", modelId);
        return applyPatch(tx, orgId, modelId, { status: "ready", jobState: "succeeded", error: null, failureCode: null, fileSize: info.bytes, checksum: info.sha256, nextPollAt: null });
      });
    },

    async readGlb(orgId, modelId) {
      const m = await store.getModel(orgId, modelId);
      if (!m || m.status !== "ready") return null;
      return blobs.get(glbKey(orgId, modelId));
    },

    async readSourceImage(orgId, modelId, view: ImageView = "front") {
      const m = await store.getModel(orgId, modelId);
      if (!m) return null;
      const ext = view === "front" ? (m.hasSourceImage ? m.sourceImageExt : null) : (m.extraImages ?? []).find((e) => e.view === view)?.ext;
      if (!ext) return null;
      const data = await blobs.get(sourceKey(orgId, modelId, ext, view));
      return data ? { data, mime: mimeOf(ext) } : null;
    },

    async deleteModel(orgId, id) {
      assertSafeId(id);
      const m = await sql.transaction(async (tx) => {
        const row = await selectForUpdate(tx, orgId, id);
        if (!row) return null;
        await tx.query("DELETE FROM public.models WHERE org_id = $1 AND id = $2", [orgId, id]);
        await audit(tx, orgId, "model.deleted", id); // the ledger is intentionally preserved
        return row;
      });
      if (!m) return false;
      await blobs.delete(glbKey(orgId, id));
      if (m.sourceImageExt) await blobs.delete(sourceKey(orgId, id, m.sourceImageExt));
      for (const e of m.extraImages ?? []) await blobs.delete(sourceKey(orgId, id, e.ext, e.view));
      return true;
    },

    async usage(orgId): Promise<UsageDto> {
      const totals = (
        await sql.query<{ reason: string; n: unknown }>("SELECT reason, COALESCE(SUM(delta), 0) AS n FROM public.usage_ledger WHERE org_id = $1 GROUP BY reason", [orgId])
      ).rows;
      const sum = (reason: string) => Number(totals.find((t) => t.reason === reason)?.n ?? 0);
      const granted = sum("local_cap_grant");
      const debited = -sum("job_debit");
      const refunded = sum("job_refund");
      const rows = (await sql.query("SELECT id, delta, reason, model_id, created_at FROM public.usage_ledger WHERE org_id = $1 ORDER BY created_at DESC LIMIT 200", [orgId])).rows;
      return {
        balance: granted - debited + refunded,
        granted,
        debited,
        refunded,
        activeJobs: await activeJobsOf(sql, orgId),
        maxActiveJobs: maxActiveJobs(),
        ledger: rows.map((l) => ({ id: String(l.id), delta: Number(l.delta), reason: l.reason as LedgerEntryDto["reason"], modelId: l.model_id ? String(l.model_id) : null, createdAt: iso(l.created_at)! })),
      };
    },

    async listPollable() {
      return (await sql.query("SELECT * FROM public.models WHERE source = 'ai' AND status = 'processing'")).rows.map(fromRow);
    },

    /** Takes a lease on the jobs that are due. Several workers can run at once: SKIP LOCKED and the lease keep them from checking the same job. */
    async claimPollable(limit = 20) {
      const res = await sql.query(
        `UPDATE public.models SET lease_until = now() + ($2 * interval '1 second')
         WHERE id IN (
           SELECT id FROM public.models
           WHERE source = 'ai' AND status = 'processing' AND NOT stalled
             AND (next_poll_at IS NULL OR next_poll_at <= now())
             AND (lease_until IS NULL OR lease_until <= now())
           ORDER BY next_poll_at NULLS FIRST
           LIMIT $1
           FOR UPDATE SKIP LOCKED
         )
         RETURNING *`,
        [limit, LEASE_SECONDS],
      );
      return res.rows.map(fromRow);
    },

    async listDisabledEngines() {
      return (await sql.query<{ engine_id: string }>("SELECT engine_id FROM public.engine_switches WHERE disabled")).rows.map((r) => r.engine_id);
    },

    /** For provider callbacks, which identify a job only by the provider's id. */
    async findByProviderJob(providerJobId) {
      const r = (await sql.query("SELECT * FROM public.models WHERE provider_job_id = $1 LIMIT 1", [providerJobId])).rows[0];
      return r ? fromRow(r) : null;
    },

    async listJobEvents(orgId, modelId): Promise<JobEventDto[]> {
      if (!asUuid(modelId)) return [];
      const rows = (await sql.query("SELECT id, state, detail, created_at FROM public.job_events WHERE org_id = $1 AND model_id = $2 ORDER BY created_at, id", [orgId, modelId])).rows;
      return rows.map((e) => ({ id: String(e.id), state: e.state as JobState, detail: (e.detail as string | null) ?? null, at: iso(e.created_at)! }));
    },

    /** Recorded once per model, when the provider accepts the job. */
    async recordCost(orgId, modelId, engineId, usd, evidence: PriceEvidence) {
      await sql.query(
        `INSERT INTO public.provider_cost_events (id, org_id, model_id, engine_id, usd, evidence, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (org_id, model_id) DO NOTHING`,
        [randomUUID(), orgId, modelId, engineId, usd, evidence, nowIso()],
      );
    },

    async listCostEvents(orgId): Promise<CostEventRow[]> {
      const rows = (await sql.query("SELECT id, org_id, model_id, engine_id, usd, evidence, created_at FROM public.provider_cost_events WHERE org_id = $1 ORDER BY created_at", [orgId])).rows;
      return rows.map((c) => ({ id: String(c.id), orgId: String(c.org_id), modelId: String(c.model_id), engineId: String(c.engine_id), usd: Number(c.usd), evidence: c.evidence as PriceEvidence, at: iso(c.created_at)! }));
    },

    async rawModelsForOrgs() {
      return Number((await sql.query<{ n: unknown }>("SELECT COUNT(*) AS n FROM public.models")).rows[0].n);
    },

    /** Test helper: wipe everything. Refuses to run outside test mode. */
    async __resetForTests() {
      if (process.env.ORBITSHELF_TEST !== "1") throw new Error("Refusing to reset outside test mode.");
      await sql.query("TRUNCATE public.organizations CASCADE");
    },
  };

  async function insertModel(tx: Queryable, row: ModelRow) {
    const { columns, values } = toColumns(row);
    const placeholders = columns.map((c, i) => `$${i + 1}`).join(", ");
    await tx.query(`INSERT INTO public.models (${columns.join(", ")}) VALUES (${placeholders})`, values);
  }

  return store;
}

export const postgresStoreFromEnv = (url: string): Store => createPostgresStore(pgClient(url), blobStoreFromEnv());
