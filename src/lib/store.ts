import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { dataDir, maxActiveJobs, paidAttemptCap } from "@/lib/env";
import {
  CHECKLIST_KEYS,
  providerCreditsEstimate,
  type Checklist,
  type Dimensions,
  type FailureCode,
  type ImageView,
  type JobEventDto,
  type JobState,
  type LedgerEntryDto,
  type ModelDto,
  type PriceEvidence,
  type UsageDto,
} from "@/lib/types";

type ImageExt = "png" | "jpg";
/** A stored source photo for a view other than `front` (the front photo keeps the original `sourceImageExt` fields). */
export type ExtraImage = { view: Exclude<ImageView, "front">; ext: ImageExt };

/** Everything a stored model has: the client-safe DTO plus private fields. */
export type ModelRow = ModelDto & {
  orgId: string;
  providerJobId: string | null;
  /** The provider's own URLs for this job, when it requires using them as given. */
  providerJobUrls?: { status: string; response: string; cancel?: string } | null;
  idempotencyKey: string | null;
  hasSourceImage: boolean;
  sourceImageExt: ImageExt | null;
  /** Rows written before multi-photo support have no `extraImages`. */
  extraImages?: ExtraImage[];
  sourceImageSha256: string | null;
  nextPollAt: string | null;
  pollCount: number;
  lastPolledAt: string | null;
  lastPollError: string | null;
};

type OrgRow = { id: string; name: string; createdAt: string };
type UserRow = { id: string; email: string; orgId: string; createdAt: string };
type LedgerRow = {
  id: string;
  orgId: string;
  idempotencyKey: string;
  delta: number;
  reason: LedgerEntryDto["reason"];
  modelId: string | null;
  createdAt: string;
};
type AuditRow = { id: string; orgId: string; action: string; modelId: string | null; at: string; detail?: string };
type JobEventRow = JobEventDto & { orgId: string; modelId: string };
/** What a provider job cost us. Separate from the ledger, which tracks what the customer used. */
export type CostEventRow = { id: string; orgId: string; modelId: string; engineId: string; usd: number; evidence: PriceEvidence; at: string };
type Db = { version: 1; orgs: OrgRow[]; users: UserRow[]; models: ModelRow[]; ledger: LedgerRow[]; audit: AuditRow[]; jobEvents: JobEventRow[]; costEvents: CostEventRow[] };

export const emptyChecklist = (): Checklist => Object.fromEntries(CHECKLIST_KEYS.map((k) => [k, false])) as Checklist;
export const emptyDimensions = (): Dimensions => ({ widthMm: null, heightMm: null, depthMm: null });
const nowIso = () => new Date().toISOString();

export function toDto(row: ModelRow): ModelDto {
  const {
    orgId: _o,
    providerJobId,
    providerJobUrls: _u,
    idempotencyKey: _i,
    hasSourceImage: _h,
    sourceImageExt: _e,
    extraImages: _x,
    sourceImageSha256: _s,
    nextPollAt: _n,
    pollCount: _p,
    lastPolledAt: _l,
    lastPollError: _le,
    ...dto
  } = row;
  // Rows saved before multi-photo / text support lack these fields: derive them.
  return {
    ...dto,
    engineId: row.engineId ?? null,
    estimatedCostUsd: row.estimatedCostUsd ?? null,
    inputKind: row.inputKind ?? (row.source === "ai" ? "image" : null),
    sourceViews: row.sourceViews ?? (row.hasSourceImage ? ["front"] : []),
    prompt: row.prompt ?? null,
    providerJobRef: providerJobId ? "…" + providerJobId.slice(-6) : null,
  };
}

export function orgIdForEmail(email: string): string {
  return "org_" + createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 24);
}

/* ───────── persistence primitives ───────── */

const g = globalThis as unknown as { __osQueue?: Promise<unknown> };

function dbFile() {
  return path.join(dataDir(), "db.json");
}
function ensureDirs() {
  mkdirSync(path.join(dataDir(), "files"), { recursive: true });
  mkdirSync(path.join(dataDir(), "uploads"), { recursive: true });
}
const LEGACY_JOB_STATES: Record<string, JobState> = { pending: "queued", success: "succeeded", error: "failed" };

/** Rows written before the multi-engine version used a provider name as the source and a shorter list of job states. */
function upgradeRows(db: Db): Db {
  db.jobEvents ??= [];
  db.costEvents ??= [];
  for (const m of db.models) {
    if ((m.source as string) === "sloyd") {
      m.source = "ai";
      m.engineId ??= "sloyd";
    }
    const next = LEGACY_JOB_STATES[m.jobState as string];
    if (next) m.jobState = next;
    if (m.jobState === "queued" && !m.providerJobId && m.status === "processing") m.jobState = "reserved";
  }
  return db;
}

function readDb(): Db {
  ensureDirs();
  if (!existsSync(dbFile())) return { version: 1, orgs: [], users: [], models: [], ledger: [], audit: [], jobEvents: [], costEvents: [] };
  let db: Db;
  try {
    db = JSON.parse(readFileSync(dbFile(), "utf8")) as Db;
  } catch {
    throw new Error("Local database is unreadable (.data/db.json). Fix or remove it.");
  }
  return upgradeRows(db);
}
function writeDb(db: Db) {
  ensureDirs();
  const tmp = dbFile() + "." + process.pid + ".tmp";
  writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  for (let i = 0; ; i++) {
    try {
      renameSync(tmp, dbFile());
      return;
    } catch (e) {
      if (i >= 8) throw e;
      const end = Date.now() + 25 * (i + 1);
      while (Date.now() < end) {
        /* brief spin; Windows can briefly lock the destination */
      }
    }
  }
}

/** Serialises all read-modify-write cycles so ledger debits and job reservations are atomic. */
function tx<T>(fn: (db: Db) => T | Promise<T>, write = true): Promise<T> {
  const run = async () => {
    const db = readDb();
    const result = await fn(db);
    if (write) writeDb(db);
    return result;
  };
  const next = (g.__osQueue ?? Promise.resolve()).then(run, run);
  g.__osQueue = next.catch(() => undefined);
  return next;
}

const fileFor = (orgId: string, modelId: string) => path.join(dataDir(), "files", orgId, `${modelId}.glb`);
const sourceFor = (orgId: string, modelId: string, ext: string, view: ImageView = "front") =>
  path.join(dataDir(), "uploads", orgId, view === "front" ? `${modelId}.${ext}` : `${modelId}.${view}.${ext}`);
const mimeOf = (ext: string) => (ext === "jpg" ? "image/jpeg" : "image/png");

/** A source photo to persist alongside a reserved job. */
export type SourcePhoto = { view: ImageView; ext: ImageExt; buffer: Buffer };
const assertSafeId = (id: string) => {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) throw new Error("Invalid identifier.");
  return id;
};

function balanceOf(db: Db, orgId: string) {
  return db.ledger.filter((l) => l.orgId === orgId).reduce((n, l) => n + l.delta, 0);
}
/** A job that timed out no longer holds a slot: it would block the workspace forever. */
const activeJobsOf = (db: Db, orgId: string) => db.models.filter((m) => m.orgId === orgId && m.source === "ai" && m.status === "processing" && !m.stalled).length;

function pushLedger(db: Db, row: Omit<LedgerRow, "id" | "createdAt">): { created: boolean; row: LedgerRow } {
  const existing = db.ledger.find((l) => l.orgId === row.orgId && l.idempotencyKey === row.idempotencyKey);
  if (existing) return { created: false, row: existing };
  const created: LedgerRow = { ...row, id: randomUUID(), createdAt: nowIso() };
  db.ledger.push(created);
  return { created: true, row: created };
}
function audit(db: Db, orgId: string, action: string, modelId: string | null, detail?: string) {
  db.audit.push({ id: randomUUID(), orgId, action, modelId, at: nowIso(), detail });
  if (db.audit.length > 5000) db.audit.splice(0, db.audit.length - 5000);
}
function jobEvent(db: Db, orgId: string, modelId: string, state: JobState, detail: string | null = null) {
  db.jobEvents.push({ id: randomUUID(), orgId, modelId, state, detail, at: nowIso() });
}

/* ───────── public store API ───────── */

export const store = {
  /** Creates (or returns) the user + workspace for an email. Grants the local paid-attempt safety cap once. */
  async signIn(email: string) {
    const clean = email.trim().toLowerCase();
    return tx((db) => {
      const orgId = orgIdForEmail(clean);
      let org = db.orgs.find((o) => o.id === orgId);
      if (!org) {
        org = { id: orgId, name: clean.split("@")[0] || "Workspace", createdAt: nowIso() };
        db.orgs.push(org);
        pushLedger(db, { orgId, idempotencyKey: "grant:initial", delta: paidAttemptCap(), reason: "local_cap_grant", modelId: null });
        audit(db, orgId, "org.created", null);
      }
      let user = db.users.find((u) => u.email === clean);
      if (!user) {
        user = { id: "usr_" + orgId.slice(4, 20), email: clean, orgId, createdAt: nowIso() };
        db.users.push(user);
      }
      return { user, org };
    });
  },

  async getOrg(orgId: string) {
    return tx((db) => db.orgs.find((o) => o.id === orgId) ?? null, false);
  },

  async listModels(orgId: string): Promise<ModelRow[]> {
    return tx((db) => db.models.filter((m) => m.orgId === orgId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), false);
  },

  /** Every read is scoped by organisation: another tenant's id simply does not exist. */
  async getModel(orgId: string, id: string): Promise<ModelRow | null> {
    return tx((db) => db.models.find((m) => m.orgId === orgId && m.id === id) ?? null, false);
  },

  async insertDemoModel(orgId: string, row: ModelRow, glb: Buffer) {
    assertSafeId(row.id);
    return tx((db) => {
      const dir = path.join(dataDir(), "files", orgId);
      mkdirSync(dir, { recursive: true });
      writeFileSync(fileFor(orgId, row.id), glb);
      db.models.push(row);
      audit(db, orgId, "model.created.demo", row.id);
      return row;
    });
  },

  /**
   * Atomically: idempotency lookup → concurrency cap → balance check → ledger debit → model row insert.
   * The provider call happens afterwards, outside the lock.
   */
  async reserveProviderJob(orgId: string, row: ModelRow, photos: SourcePhoto[]) {
    assertSafeId(row.id);
    return tx((db) => {
      if (row.idempotencyKey) {
        const dup = db.models.find((m) => m.orgId === orgId && m.idempotencyKey === row.idempotencyKey);
        if (dup) return { ok: true as const, duplicate: true as const, model: dup };
      }
      if (activeJobsOf(db, orgId) >= maxActiveJobs()) return { ok: false as const, reason: "too_many_active" as const };
      if (balanceOf(db, orgId) < 1) return { ok: false as const, reason: "insufficient" as const };
      pushLedger(db, { orgId, idempotencyKey: `debit:${row.id}`, delta: -1, reason: "job_debit", modelId: row.id });
      if (photos.length > 0) {
        const dir = path.join(dataDir(), "uploads", orgId);
        mkdirSync(dir, { recursive: true });
        for (const p of photos) writeFileSync(sourceFor(orgId, row.id, p.ext, p.view), p.buffer);
      }
      db.models.push({ ...row, attemptsDebited: 1 });
      jobEvent(db, orgId, row.id, "reserved");
      audit(db, orgId, "job.reserved", row.id);
      return { ok: true as const, duplicate: false as const, model: db.models[db.models.length - 1] };
    });
  },

  async updateModel(orgId: string, id: string, patch: Partial<ModelRow>): Promise<ModelRow | null> {
    return tx((db) => {
      const m = db.models.find((x) => x.orgId === orgId && x.id === id);
      if (!m) return null;
      if (patch.jobState && patch.jobState !== m.jobState) jobEvent(db, orgId, id, patch.jobState);
      Object.assign(m, patch, { updatedAt: nowIso() });
      return m;
    });
  },

  /** Idempotent refund of the single attempt debited for a model. */
  async refundJob(orgId: string, modelId: string, why: string): Promise<boolean> {
    return tx((db) => {
      const m = db.models.find((x) => x.orgId === orgId && x.id === modelId);
      if (!m) return false;
      const debit = db.ledger.find((l) => l.orgId === orgId && l.idempotencyKey === `debit:${modelId}`);
      if (!debit) return false;
      const { created } = pushLedger(db, { orgId, idempotencyKey: `refund:${modelId}`, delta: 1, reason: "job_refund", modelId });
      if (created) {
        m.attemptsRefunded += 1;
        m.updatedAt = nowIso();
        audit(db, orgId, "job.refunded", modelId, why);
      }
      return created;
    });
  },

  async markFailed(orgId: string, modelId: string, input: { error: string; failureCode: FailureCode; refund: boolean }) {
    return tx((db) => {
      const m = db.models.find((x) => x.orgId === orgId && x.id === modelId);
      if (!m) return null;
      if (m.status !== "processing") return m; // never overwrite a finished model
      m.status = "failed";
      // An uncertain outcome is not a plain failure: the provider may have charged, and a person has to check.
      m.jobState = input.failureCode === "ambiguous" || input.failureCode === "invalid_output" ? "needs_review" : "failed";
      jobEvent(db, orgId, modelId, m.jobState, input.failureCode);
      m.error = input.error.slice(0, 400);
      m.failureCode = input.failureCode;
      m.nextPollAt = null;
      m.updatedAt = nowIso();
      if (input.refund && db.ledger.some((l) => l.orgId === orgId && l.idempotencyKey === `debit:${modelId}`)) {
        const { created } = pushLedger(db, { orgId, idempotencyKey: `refund:${modelId}`, delta: 1, reason: "job_refund", modelId });
        if (created) m.attemptsRefunded += 1;
      }
      audit(db, orgId, "job.failed", modelId, input.failureCode);
      return m;
    });
  },

  async completeJob(orgId: string, modelId: string, glb: Buffer, info: { sha256: string; bytes: number }) {
    return tx((db) => {
      const m = db.models.find((x) => x.orgId === orgId && x.id === modelId);
      if (!m) return null;
      if (m.status === "ready") return m;
      mkdirSync(path.join(dataDir(), "files", orgId), { recursive: true });
      writeFileSync(fileFor(orgId, modelId), glb);
      m.status = "ready";
      m.jobState = "succeeded";
      jobEvent(db, orgId, modelId, "succeeded");
      m.error = null;
      m.failureCode = null;
      m.fileSize = info.bytes;
      m.checksum = info.sha256;
      m.nextPollAt = null;
      m.updatedAt = nowIso();
      audit(db, orgId, "job.completed", modelId);
      return m;
    });
  },

  async readGlb(orgId: string, modelId: string): Promise<Buffer | null> {
    assertSafeId(modelId);
    return tx((db) => {
      const m = db.models.find((x) => x.orgId === orgId && x.id === modelId);
      if (!m || m.status !== "ready") return null;
      const f = fileFor(orgId, modelId);
      return existsSync(f) ? readFileSync(f) : null;
    }, false);
  },

  async readSourceImage(orgId: string, modelId: string, view: ImageView = "front"): Promise<{ data: Buffer; mime: string } | null> {
    assertSafeId(modelId);
    return tx((db) => {
      const m = db.models.find((x) => x.orgId === orgId && x.id === modelId);
      if (!m) return null;
      const ext = view === "front" ? (m.hasSourceImage ? m.sourceImageExt : null) : (m.extraImages ?? []).find((e) => e.view === view)?.ext;
      if (!ext) return null;
      const f = sourceFor(orgId, modelId, ext, view);
      if (!existsSync(f)) return null;
      return { data: readFileSync(f), mime: mimeOf(ext) };
    }, false);
  },

  async deleteModel(orgId: string, id: string): Promise<boolean> {
    assertSafeId(id);
    return tx((db) => {
      const idx = db.models.findIndex((m) => m.orgId === orgId && m.id === id);
      if (idx < 0) return false;
      const [m] = db.models.splice(idx, 1);
      rmSync(fileFor(orgId, id), { force: true });
      if (m.sourceImageExt) rmSync(sourceFor(orgId, id, m.sourceImageExt), { force: true });
      for (const e of m.extraImages ?? []) rmSync(sourceFor(orgId, id, e.ext, e.view), { force: true });
      audit(db, orgId, "model.deleted", id); // the ledger is intentionally preserved
      return true;
    });
  },

  async usage(orgId: string): Promise<UsageDto> {
    return tx((db) => {
      const rows = db.ledger.filter((l) => l.orgId === orgId);
      const granted = rows.filter((l) => l.reason === "local_cap_grant").reduce((n, l) => n + l.delta, 0);
      const debited = -rows.filter((l) => l.reason === "job_debit").reduce((n, l) => n + l.delta, 0);
      const refunded = rows.filter((l) => l.reason === "job_refund").reduce((n, l) => n + l.delta, 0);
      return {
        balance: granted - debited + refunded,
        granted,
        debited,
        refunded,
        activeJobs: activeJobsOf(db, orgId),
        maxActiveJobs: maxActiveJobs(),
        ledger: rows
          .map((l) => ({ id: l.id, delta: l.delta, reason: l.reason, modelId: l.modelId, createdAt: l.createdAt }))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 200),
      };
    }, false);
  },

  /** For the background poller: all provider jobs that still need attention, across tenants. */
  async listPollable(): Promise<ModelRow[]> {
    return tx((db) => db.models.filter((m) => m.source === "ai" && m.status === "processing"), false);
  },

  /** For provider callbacks, which identify a job only by the provider's id. */
  async findByProviderJob(providerJobId: string): Promise<ModelRow | null> {
    return tx((db) => db.models.find((m) => m.providerJobId === providerJobId) ?? null, false);
  },

  async listJobEvents(orgId: string, modelId: string): Promise<JobEventDto[]> {
    return tx(
      (db) =>
        db.jobEvents
          .filter((e) => e.orgId === orgId && e.modelId === modelId)
          .map(({ id, state, detail, at }) => ({ id, state, detail, at })),
      false,
    );
  },

  /** Recorded once per model, when the provider accepts the job. A job the provider never started has no cost event. */
  async recordCost(orgId: string, modelId: string, engineId: string, usd: number, evidence: PriceEvidence): Promise<void> {
    await tx((db) => {
      if (db.costEvents.some((c) => c.orgId === orgId && c.modelId === modelId)) return;
      db.costEvents.push({ id: randomUUID(), orgId, modelId, engineId, usd, evidence, at: nowIso() });
    });
  },

  async listCostEvents(orgId: string): Promise<CostEventRow[]> {
    return tx((db) => db.costEvents.filter((c) => c.orgId === orgId), false);
  },

  async rawModelsForOrgs(): Promise<number> {
    return tx((db) => db.models.length, false);
  },

  /** Test helper: wipe everything. Refuses to run outside test mode. */
  async __resetForTests() {
    if (process.env.ORBITSHELF_TEST !== "1") throw new Error("Refusing to reset outside test mode.");
    const root = dataDir();
    for (const entry of existsSync(root) ? readdirSync(root) : []) if (entry !== "session-secret") rmSync(path.join(root, entry), { recursive: true, force: true });
  },
};

export const estimateProviderCredits = providerCreditsEstimate;
export { nowIso };
