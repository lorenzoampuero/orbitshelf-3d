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
