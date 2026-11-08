import "server-only";
import { createHash } from "node:crypto";
import {
  CHECKLIST_KEYS,
  type AssetVersionDto,
  type ApiScope,
  type ApiTokenDto,
  type WebhookDeliveryDto,
  type WebhookEndpointDto,
  type EmbedDto,
  type PublicationDto,
  type PublicationState,
  type ProjectDto,
  providerCreditsEstimate,
  type Checklist,
  type Dimensions,
  type ImageView,
  type JobEventDto,
  type LedgerEntryDto,
  type MeshDiagnostics,
  type ModelDto,
  type PriceEvidence,
  type UserProfile,
  type VersionPreset,
} from "@/lib/types";

export type ImageExt = "png" | "jpg";
export type ThumbnailExt = ImageExt;
/** A stored source photo for a view other than `front` (the front photo keeps the original `sourceImageExt` fields). */
export type ExtraImage = { view: Exclude<ImageView, "front">; ext: ImageExt };

/** Everything a stored model has: the client-safe DTO plus private fields. */
export type ModelRow = ModelDto & {
  /** Provider cost when the job was created, in USD. Owner-only: never part of ModelDto, so it never reaches a customer or the API. */
  estimatedCostUsd: number | null;
  /** Sloyd credits the job was estimated at. Owner-only, same as above. */
  providerCreditsEstimate: number;
  orgId: string;
  providerJobId: string | null;
  /** Extension of the stored thumbnail, when there is one. */
  thumbnailExt?: ImageExt | null;
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

export type VersionRow = { id: string; orgId: string; modelId: string; preset: VersionPreset; bytes: number; sha256: string; diagnostics: MeshDiagnostics; createdAt: string };

export type EmbedRow = { id: string; token: string; orgId: string; modelId: string; allowedDomains: string[]; createdAt: string; revokedAt: string | null };
export type ProjectRow = ProjectDto & { orgId: string };
export const TRASH_RETENTION_DAYS = 30;

export type IntegrationRow = { orgId: string; shop: string; accessTokenEnc: string; refreshTokenEnc: string | null; expiresAt: string | null; scopes: string; connectedAt: string; revokedAt: string | null };
export type PublicationRow = { id: string; orgId: string; modelId: string; checksum: string; shop: string; productId: string; productTitle: string; state: PublicationState; remoteFileId: string | null; error: string | null; createdAt: string; updatedAt: string };

export type ApiTokenRow = { id: string; orgId: string; name: string; tokenHash: string; prefix: string; scopes: ApiScope[]; createdAt: string; lastUsedAt: string | null; revokedAt: string | null };

export type WebhookEndpointRow = { id: string; orgId: string; url: string; secretEnc: string; createdAt: string; disabledAt: string | null };
export type WebhookDeliveryRow = { id: string; endpointId: string; orgId: string; event: string; dedupeKey: string; payload: string; attempts: number; nextAttemptAt: string | null; deliveredAt: string | null; lastStatus: number | null; lastError: string | null; createdAt: string };
/** A delivery that is due, with where it goes. Only the worker sees this. */
export type DueWebhook = WebhookDeliveryRow & { url: string; secretEnc: string };
export type WebhookResult = { deliveredAt: string | null; lastStatus: number | null; lastError: string | null; nextAttemptAt: string | null };

export type OrgRow = { id: string; name: string; createdAt: string };
export type UserRow = { id: string; email: string; orgId: string; createdAt: string; profile?: UserProfile };
export type LedgerRow = {
  id: string;
  orgId: string;
  idempotencyKey: string;
  delta: number;
  reason: LedgerEntryDto["reason"];
  modelId: string | null;
  createdAt: string;
};
export type AuditRow = { id: string; orgId: string; action: string; modelId: string | null; at: string; detail?: string };
export type JobEventRow = JobEventDto & { orgId: string; modelId: string };
/** What a provider job cost us. Separate from the ledger, which tracks what the customer used. */
export type CostEventRow = { id: string; orgId: string; modelId: string; engineId: string; usd: number; evidence: PriceEvidence; at: string };
export type LocalDb = { version: 1; billingEvents?: BillingEventRow[]; orgs: OrgRow[]; users: UserRow[]; models: ModelRow[]; ledger: LedgerRow[]; audit: AuditRow[]; jobEvents: JobEventRow[]; costEvents: CostEventRow[]; versions: VersionRow[]; projects: ProjectRow[]; embeds: EmbedRow[]; integrations: IntegrationRow[]; publications: PublicationRow[]; apiTokens: ApiTokenRow[]; webhookEndpoints: WebhookEndpointRow[]; webhookDeliveries: WebhookDeliveryRow[] };

/** What the payment webhook and the admin panel did with a payment or a credit change. Owner-only: never part of a customer DTO. */
export const BILLING_EVENT_KINDS = ["payment", "refund", "dispute", "admin_adjustment"] as const;
export type BillingEventKind = (typeof BILLING_EVENT_KINDS)[number];
export type BillingEventRow = { id: string; kind: BillingEventKind; paymentId: string | null; orgId: string | null; credits: number; outcome: string; detail: string | null; createdAt: string };
/** Outcomes that need no attention. Anything else (payment not credited, refund waiting for a manual reversal) is listed as pending. */
export const BILLING_OK_OUTCOMES = ["credited", "duplicate", "ignored", "adjusted", "resolved"] as const;
export const billingNeedsAttention = (e: Pick<BillingEventRow, "outcome">) => !(BILLING_OK_OUTCOMES as readonly string[]).includes(e.outcome);

export type AdminWorkspaceRow = { orgId: string; name: string; email: string | null; createdAt: string; balance: number; models: number; lastActivityAt: string | null };
export type AdminSummary = { workspaces: number; users: number; models: number; ready: number; failed: number; processing: number; creditsGranted: number; paymentsCredited: number; needsAttention: number };

export const emptyChecklist = (): Checklist => Object.fromEntries(CHECKLIST_KEYS.map((k) => [k, false])) as Checklist;
export const emptyDimensions = (): Dimensions => ({ widthMm: null, heightMm: null, depthMm: null });
export const emptyProfile = (): UserProfile => ({ useCase: null, experience: null, goal: null, activeWorkspace: null, onboardedAt: null, skippedAt: null });
export const nowIso = () => new Date().toISOString();

export function toDto(row: ModelRow): ModelDto {
  const {
    orgId: _o,
    estimatedCostUsd: _cost,
    providerCreditsEstimate: _pce,
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
    currentVersionId: row.currentVersionId ?? null,
    projectId: row.projectId ?? null,
    tags: row.tags ?? [],
    favorite: row.favorite ?? false,
    hasThumbnail: row.hasThumbnail ?? false,
    deletedAt: row.deletedAt ?? null,
    inputKind: row.inputKind ?? (row.source === "ai" ? "image" : null),
    sourceViews: row.sourceViews ?? (row.hasSourceImage ? ["front"] : []),
    prompt: row.prompt ?? null,
    providerJobRef: providerJobId ? "…" + providerJobId.slice(-6) : null,
  };
}

export function orgIdForEmail(email: string): string {
  return "org_" + createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 24);
}

/** A source photo to persist alongside a reserved job. */
export type SourcePhoto = { view: ImageView; ext: ImageExt; buffer: Buffer };
export const mimeOf = (ext: string) => (ext === "jpg" ? "image/jpeg" : "image/png");

export const assertSafeId = (id: string) => {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) throw new Error("Invalid identifier.");
  return id;
};

/** Where a model's files live in any blob store. Org and model ids are server-generated and checked by `assertSafeId`. */
export const glbKey = (orgId: string, modelId: string) => `files/${assertSafeId(orgId)}/${assertSafeId(modelId)}.glb`;
export const sourceKey = (orgId: string, modelId: string, ext: string, view: ImageView = "front") =>
  `uploads/${assertSafeId(orgId)}/${view === "front" ? `${assertSafeId(modelId)}.${ext}` : `${assertSafeId(modelId)}.${view}.${ext}`}`;

export const versionKey = (orgId: string, modelId: string, versionId: string) => `files/${assertSafeId(orgId)}/${assertSafeId(modelId)}.${assertSafeId(versionId)}.glb`;

export const thumbnailKey = (orgId: string, modelId: string, ext: string) => `thumbs/${assertSafeId(orgId)}/${assertSafeId(modelId)}.${ext}`;

export const toEmbedDto = (e: EmbedRow): EmbedDto => ({ id: e.id, token: e.token, modelId: e.modelId, allowedDomains: e.allowedDomains, createdAt: e.createdAt, active: !e.revokedAt });

export const toPublicationDto = (p: PublicationRow): PublicationDto => ({ id: p.id, modelId: p.modelId, shop: p.shop, productId: p.productId, productTitle: p.productTitle, state: p.state, error: p.error, createdAt: p.createdAt });

/** Never includes the secret. */
export const toWebhookEndpointDto = (e: WebhookEndpointRow): WebhookEndpointDto => ({ id: e.id, url: e.url, createdAt: e.createdAt, active: !e.disabledAt });
/** Never includes the payload. */
export const toWebhookDeliveryDto = (d: WebhookDeliveryRow): WebhookDeliveryDto => ({
  id: d.id,
  endpointId: d.endpointId,
  event: d.event,
  attempts: d.attempts,
  state: d.deliveredAt ? "delivered" : d.nextAttemptAt ? "pending" : "failed",
  lastStatus: d.lastStatus,
  lastError: d.lastError,
  createdAt: d.createdAt,
});

/** Never includes the hash. */
export const toApiTokenDto = (t: ApiTokenRow): ApiTokenDto => ({ id: t.id, name: t.name, prefix: t.prefix, scopes: t.scopes, createdAt: t.createdAt, lastUsedAt: t.lastUsedAt, active: !t.revokedAt });

export function toVersionDto(v: VersionRow, model: Pick<ModelRow, "currentVersionId">): AssetVersionDto {
  const current = model.currentVersionId ? model.currentVersionId === v.id : v.preset === "original";
  return { id: v.id, preset: v.preset, bytes: v.bytes, sha256: v.sha256, diagnostics: v.diagnostics, createdAt: v.createdAt, current };
}

export const estimateProviderCredits = providerCreditsEstimate;
