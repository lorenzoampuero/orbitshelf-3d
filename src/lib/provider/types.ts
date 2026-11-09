import type { FalConfig, MeshyConfig, ProviderConfig } from "@/lib/env";
import type { NormalizedImage } from "@/lib/image";
import type { EngineLifecycle, EngineTier, ImageView, InputKind, PriceEvidence, TextureResolution } from "@/lib/types";

export type ProviderId = "sloyd" | "fal" | "meshy";

export type ProviderErrorKind = "payment_required" | "auth" | "rate_limited" | "rejected" | "server" | "network" | "timeout" | "not_ready" | "not_configured" | "invalid_response";

export class ProviderError extends Error {
  constructor(
    public kind: ProviderErrorKind,
    message: string,
    public status?: number,
    /** True when the provider definitely did NOT start (or has refunded) the job → safe to refund locally. */
    public definite = false,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export type NormalizedStatus = "pending" | "running" | "success" | "error";
export type JobSnapshot = { status: NormalizedStatus; rawStatus: string; errorMessage: string | null };

/** Injection points for tests. Real calls read their configuration from the environment. */
export type Deps = { fetch?: typeof fetch; config?: ProviderConfig | null; falConfig?: FalConfig | null; meshyConfig?: MeshyConfig | null; timeoutMs?: number };

/** What a generation starts from: one photo, 2 or more photos of the same object (front is required), or a text description. */
export type ProviderInput =
  | { kind: "image"; image: NormalizedImage }
  | { kind: "multi-image"; images: Partial<Record<ImageView, NormalizedImage>> }
  | { kind: "text"; prompt: string };

export type GenerationRequest = { source: ProviderInput; textureResolution: TextureResolution };

/** How to reach a submitted job again. `urls` are the provider's own URLs, kept because some providers require using them as given. */
export type ProviderJobRef = { jobId: string; urls?: { status: string; response: string; cancel?: string } | null };

export type PriceQuery = { mode: InputKind; photoCount: number; texture: TextureResolution };
export type PriceLine = { code: "generation" | "texture" | "multi_view" | "detail"; usd: number };

export type EngineDefinition = {
  id: string;
  provider: ProviderId;
  label: string;
  tier: EngineTier;
  /** Left out of the model picker when false. Kept for engines we do not want to lead with (a rival's own consumer product, an estimated price). */
  listed?: boolean;
  /** `disabled` engines are never offered. A disabled engine can only run after a deliberate pilot through ENGINES_ENABLED. */
  lifecycle: EngineLifecycle;
  modes: InputKind[];
  maxPhotos: number;
  views: ImageView[];
  /** Whether the engine can produce an untextured model on request. */
  geometryOnly: boolean;
  /** Formats the engine can return. Only `glb` is stored today. */
  exports: string[];
  priceSource: string;
  /** Date the published price was last read at its source. This is never an invoice. */
  priceVerifiedAt: string;
  priceEvidence: PriceEvidence;
  price: (q: PriceQuery) => PriceLine[];
  fal?: {
    endpoint: string;
    buildInput: (req: GenerationRequest) => Record<string, unknown>;
    glbUrl: (output: unknown) => string | null;
  };
  meshy?: {
    aiModel: string;
  };
};

/** The single contract every provider implements, so jobs never branch on a provider's name. */
export interface ModelAdapter {
  provider: ProviderId;
  isConfigured(deps?: Deps): boolean;
  submit(engine: EngineDefinition, req: GenerationRequest, deps?: Deps): Promise<ProviderJobRef>;
  getStatus(engine: EngineDefinition, job: ProviderJobRef, deps?: Deps): Promise<JobSnapshot>;
  /** Downloads the finished GLB. The caller must validate the bytes before storing them. */
  fetchResult(engine: EngineDefinition, job: ProviderJobRef, deps?: Deps): Promise<Buffer>;
}
