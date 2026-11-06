/** Types shared by server and client code. Never put secrets or private storage paths in here. */

export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const DEMO_ASSETS = ["vase", "lamp", "chair"] as const;
export type DemoAsset = (typeof DEMO_ASSETS)[number];

export const CATEGORIES = ["apparel", "footwear", "furniture", "home-decor", "lighting", "accessories", "other"] as const;
export type Category = (typeof CATEGORIES)[number];

export const TEXTURE_RESOLUTIONS = ["none", "512", "1k", "2k"] as const;
export type TextureResolution = (typeof TEXTURE_RESOLUTIONS)[number];

/** How a paid model is generated. Demo samples have no input kind. */
export const INPUT_KINDS = ["image", "multi-image", "text"] as const;
export type InputKind = (typeof INPUT_KINDS)[number];

/** Photo views accepted for generation. `front` is always required; multi-photo adds at least one more. */
export const IMAGE_VIEWS = ["front", "left", "back", "right"] as const;
export type ImageView = (typeof IMAGE_VIEWS)[number];
export const MAX_PROMPT_CHARS = 1000;

/** Internal unit: 1 generation attempt. Provider credits are recorded separately as an estimate only. */
export const PROVIDER_CREDITS_PER_ATTEMPT = 20; // 1 photo: 10 base + 10 texturing (Sloyd pricing, 2026-10-27)
export const PROVIDER_CREDITS_GEOMETRY_ONLY = 10;
export const PROVIDER_CREDITS_MULTI_IMAGE = 30; // 2–4 photos, textured (PBR)
export const PROVIDER_CREDITS_MULTI_IMAGE_GEOMETRY_ONLY = 20; // estimate: not published separately
export const PROVIDER_CREDITS_TEXT = 25; // text, textured
export const PROVIDER_CREDITS_TEXT_GEOMETRY_ONLY = 15; // estimate: not published separately
export const PROVIDER_CREDITS_PER_USD = 75;

/** Provider credits one generation is expected to use (an estimate shown to the user, never a charge). Safe for client code. */
export function providerCreditsEstimate(texture: string | null, kind: InputKind = "image"): number {
  const geometryOnly = texture === "none";
  if (kind === "multi-image") return geometryOnly ? PROVIDER_CREDITS_MULTI_IMAGE_GEOMETRY_ONLY : PROVIDER_CREDITS_MULTI_IMAGE;
  if (kind === "text") return geometryOnly ? PROVIDER_CREDITS_TEXT_GEOMETRY_ONLY : PROVIDER_CREDITS_TEXT;
  return geometryOnly ? PROVIDER_CREDITS_GEOMETRY_ONLY : PROVIDER_CREDITS_PER_ATTEMPT;
}

export type ModelSource = "demo" | "ai" | "import";
/** What the file really is. Demo samples and imported files are never described as AI reconstructions. */
export type Provenance = "demo-sample" | "ai-generated" | "imported";
/**
 * `reserved`: attempt debited, provider not yet called. `queued` / `running`: at the provider. `processing`: the provider finished and the file is being
 * downloaded and validated. `needs_review`: the outcome is uncertain and a person must check it. `timed_out`: no answer within the limit.
 */
export const JOB_STATES = ["reserved", "queued", "running", "processing", "succeeded", "failed", "cancelled", "timed_out", "needs_review"] as const;
export type JobState = (typeof JOB_STATES)[number];

export type EngineLifecycle = "disabled" | "pilot" | "production";
/** `published`: read from the provider's price page. `invoice`: confirmed against a real bill. */
export type PriceEvidence = "published" | "invoice";

/** Client-safe view of an engine: what it can really do, never how to call it. */
export type EngineDto = {
  id: string;
  label: string;
  lifecycle: EngineLifecycle;
  modes: InputKind[];
  maxPhotos: number;
  views: ImageView[];
  geometryOnly: boolean;
  exports: string[];
  priceVerifiedAt: string;
  priceEvidence: PriceEvidence;
  /** Credits one textured photo or text job takes on this engine. Provider prices in USD stay on the server. */
  fromCredits: number;
};

export type QuoteDto = {
  id: string;
  engineId: string;
  engineLabel: string;
  mode: InputKind;
  photoCount: number;
  texture: TextureResolution;
  /** What the job is worth in credits, whatever the billing unit. The provider cost in USD is never sent to the client. */
  credits: number;
  /** What this job takes from the balance, in `unit`. */
  charge: number;
  unit: "attempts" | "credits";
  evidence: PriceEvidence;
  priceVerifiedAt: string;
  expiresAt: string;
};

/** Technical budgets OrbitShelf can check and optimize to. See src/lib/glb-presets.ts. */
export const OPTIMIZE_PRESETS = ["web", "store", "game"] as const;
export type OptimizePreset = (typeof OPTIMIZE_PRESETS)[number];
export type VersionPreset = OptimizePreset | "original";

export const DIAGNOSTIC_WARNINGS = ["no_uv", "no_normals", "no_materials", "large_textures", "many_triangles", "heavy_file", "unusual_scale", "off_center"] as const;
export type DiagnosticWarning = (typeof DIAGNOSTIC_WARNINGS)[number];

/** Measured from the file itself. Nothing here is inferred or estimated. */
export type MeshDiagnostics = {
  bytes: number;
  vertices: number;
  triangles: number;
  meshes: number;
  primitives: number;
  materials: number;
  textures: { mime: string; width: number; height: number; bytes: number }[];
  textureBytes: number;
  maxTextureSize: number;
  hasUv: boolean;
  hasNormals: boolean;
  /** Bounding box as stored in the file. A generated model's scale is not its real-world size. */
  sizeMeters: [number, number, number];
  warnings: DiagnosticWarning[];
};

export type AssetVersionDto = { id: string; preset: VersionPreset; bytes: number; sha256: string; diagnostics: MeshDiagnostics; createdAt: string; current: boolean };

export type ProjectDto = { id: string; name: string; createdAt: string };
export type EmbedDto = { id: string; token: string; modelId: string; allowedDomains: string[]; createdAt: string; active: boolean };

export type PublicationState = "processing" | "published" | "failed";
export type PublicationDto = { id: string; modelId: string; shop: string; productId: string; productTitle: string; state: PublicationState; error: string | null; createdAt: string };

export const API_SCOPES = ["models:read", "assets:read", "credits:read", "jobs:write"] as const;
export type ApiScope = (typeof API_SCOPES)[number];
export const WEBHOOK_EVENTS = ["model.ready", "model.failed"] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];
export type WebhookEndpointDto = { id: string; url: string; createdAt: string; active: boolean };
export type WebhookDeliveryDto = { id: string; endpointId: string; event: string; attempts: number; state: "pending" | "delivered" | "failed"; lastStatus: number | null; lastError: string | null; createdAt: string };
export type EngineStats = { engineId: string; jobs: number; ready: number; failed: number; approved: number; rejected: number; publishedUsd: number };
export type ApiTokenDto = { id: string; name: string; prefix: string; scopes: ApiScope[]; createdAt: string; lastUsedAt: string | null; active: boolean };

export type JobEventDto = { id: string; state: JobState; detail: string | null; at: string };
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
  /** The engine that generated it. null for demo samples and imports. */
  engineId: string | null;
  /** The optimized version in use. null means the original file. */
  currentVersionId: string | null;
  projectId: string | null;
  tags: string[];
  favorite: boolean;
  hasThumbnail: boolean;
  /** Set while the model is in the trash. */
  deletedAt: string | null;
  /** null for demo samples. */
  inputKind: InputKind | null;
  /** Photo views stored for this model (empty for text and demo). */
  sourceViews: ImageView[];
  /** The text description the model was generated from (text mode only). */
  prompt: string | null;
  demoAsset: DemoAsset | null;
  status: ModelStatus;
  jobState: JobState;
  providerJobRef: string | null;
  error: string | null;
  failureCode: FailureCode | null;
  attemptsDebited: number;
  /** In the workspace billing unit (credits or attempts). */
  attemptsRefunded: number;
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

export type LedgerReason = "local_cap_grant" | "plan_grant" | "job_debit" | "job_capture" | "job_refund" | "adjustment" | "expiry";

export type LedgerEntryDto = {
  id: string;
  delta: number;
  reason: LedgerReason;
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

export const USE_CASES = ["commerce", "game", "pro", "explore"] as const;
export type UseCase = (typeof USE_CASES)[number];
export const EXPERIENCES = ["beginner", "intermediate", "advanced"] as const;
export type Experience = (typeof EXPERIENCES)[number];
export const GOALS = ["photos", "text", "assets", "publish"] as const;
export type Goal = (typeof GOALS)[number];
export const GENERATION_PRESETS = ["fast", "studio", "game", "advanced"] as const;
export type GenerationPreset = (typeof GENERATION_PRESETS)[number];

/** Preferences only. A profile never changes permissions, balance or accounting. */
export type UserProfile = {
  useCase: UseCase | null;
  experience: Experience | null;
  goal: Goal | null;
  activeWorkspace: UseCase | null;
  onboardedAt: string | null;
  skippedAt: string | null;
};

export type SessionUser = { userId: string; orgId: string; email: string };
