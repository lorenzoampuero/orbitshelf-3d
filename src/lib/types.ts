/** Types shared by server and client code. Never put secrets or private storage paths in here. */

export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const DEMO_ASSETS = ["vase", "lamp", "chair"] as const;
export type DemoAsset = (typeof DEMO_ASSETS)[number];

export const CATEGORIES = ["home-decor", "lighting", "furniture", "accessories", "other"] as const;
export type Category = (typeof CATEGORIES)[number];

export const TEXTURE_RESOLUTIONS = ["none", "512", "1k", "2k"] as const;
export type TextureResolution = (typeof TEXTURE_RESOLUTIONS)[number];

/** Internal unit: 1 generation attempt. Provider credits are recorded separately as an estimate only. */
export const PROVIDER_CREDITS_PER_ATTEMPT = 20; // 10 base + 10 texturing (Sloyd pricing, 2026-10-27)
export const PROVIDER_CREDITS_GEOMETRY_ONLY = 10;
export const PROVIDER_CREDITS_PER_USD = 75;

export type ModelSource = "demo" | "sloyd";
/** What the file really is. Demo samples are never described as AI reconstructions. */
export type Provenance = "demo-sample" | "ai-generated";
export type JobState = "queued" | "pending" | "running" | "success" | "error";
export type ModelStatus = "processing" | "ready" | "failed";
export type ReviewState = "pending" | "approved" | "rejected";

export const CHECKLIST_KEYS = ["shape", "surfaces", "hiddenAngles", "material", "labels"] as const;
export type ChecklistKey = (typeof CHECKLIST_KEYS)[number];
export type Checklist = Record<ChecklistKey, boolean>;

export type FailureCode =
  | "payment_required"
  | "provider_auth"
  | "rate_limited"
  | "provider_rejected"
  | "provider_error"
  | "invalid_output"
  | "ambiguous"
  | "internal";

export type Dimensions = { widthMm: number | null; heightMm: number | null; depthMm: number | null };

/** Client-safe view of a model. Intentionally omits provider job id, storage paths and upload bytes. */
export type ModelDto = {
  id: string;
  title: string;
  sku: string | null;
  category: Category;
  source: ModelSource;
  provenance: Provenance;
  demoAsset: DemoAsset | null;
  status: ModelStatus;
  jobState: JobState;
  providerJobRef: string | null;
  error: string | null;
  failureCode: FailureCode | null;
  attemptsDebited: number;
  attemptsRefunded: number;
  providerCreditsEstimate: number;
  textureResolution: TextureResolution | null;
  reviewState: ReviewState;
  checklist: Checklist;
  reviewNote: string | null;
  reviewedAt: string | null;
  /** User-provided metadata. OrbitShelf never infers real-world dimensions from a photo. */
  dimensions: Dimensions;
  fileSize: number | null;
  checksum: string | null;
  stalled: boolean;
  rightsAffirmed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LedgerEntryDto = {
  id: string;
  delta: number;
  reason: "local_cap_grant" | "job_debit" | "job_refund";
  modelId: string | null;
  createdAt: string;
};

export type UsageDto = {
  balance: number;
  granted: number;
  debited: number;
  refunded: number;
  activeJobs: number;
  maxActiveJobs: number;
  ledger: LedgerEntryDto[];
};

export type SessionUser = { userId: string; orgId: string; email: string };
