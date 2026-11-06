import "server-only";
import { creditsFor } from "@/lib/credits";
import { IMAGE_VIEWS, PROVIDER_CREDITS_PER_USD, providerCreditsEstimate, type EngineDto, type ImageView, type TextureResolution } from "@/lib/types";
import { dataUri, falAdapter } from "./fal";
import { meshyAdapter } from "./meshy";
import { sloydAdapter } from "./sloyd";
import type { Deps, EngineDefinition, GenerationRequest, ModelAdapter, PriceLine, PriceQuery, ProviderId } from "./types";
import type { NormalizedImage } from "@/lib/image";

/**
 * Engines OrbitShelf can call. Prices are the published ones read at `priceSource` on `priceVerifiedAt`, never invoices.
 * The fal engines stay `disabled`: none has been tested with real money, and fal's terms need written confirmation before resale
 * (docs/AUDITORIA_ESTADO_ACTUAL.md). Selection of the rest of the catalogue is in docs/DECISIONES_MOTORES.csv.
 */

/** Dense enough for product detail. The default of several engines (500,000 faces) is too heavy for a storefront. */
const FACE_TARGET = 200_000;

const photosOf = (req: GenerationRequest): Partial<Record<ImageView, NormalizedImage>> => {
  const s = req.source;
  if (s.kind === "image") return { front: s.image };
  return s.kind === "multi-image" ? s.images : {};
};

const fileUrl = (value: unknown): string | null => {
  const url = (value as { url?: unknown } | null | undefined)?.url;
  return typeof url === "string" && url ? url : null;
};

const round = (usd: number) => Math.round(usd * 10_000) / 10_000;

/** Hunyuan's `model_glb` holds "GLB if available, otherwise OBJ", and fal's own example is an OBJ. Only a real GLB is followed. */
const hunyuanGlb = (o: unknown): string | null => {
  const out = o as { model_glb?: { url?: unknown; content_type?: unknown }; model_urls?: { glb?: unknown } };
  const named = fileUrl(out.model_urls?.glb);
  if (named) return named;
  const url = fileUrl(out.model_glb);
  return url && out.model_glb?.content_type !== "model/obj" && !/\.obj(\?|$)/i.test(url) ? url : null;
};

/**
 * Meshy sells credits in plans, not in dollars. Its Pro plan read CLP 19,000 for 1,000 credits on 2026-11-05 (https://www.meshy.ai/pricing);
 * the Starter plan has no API. US$0.02 a credit converts that at about CLP 950, which is an assumption. Replace it with the invoice in the paid test.
 */
const MESHY_USD_PER_CREDIT = 0.02;

const ENGINES: EngineDefinition[] = [
  {
    id: "sloyd",
    provider: "sloyd",
    label: "Sloyd",
    lifecycle: "pilot",
    modes: ["image", "multi-image", "text"],
    maxPhotos: 4,
    views: ["front", "left", "back", "right"],
    geometryOnly: true,
    exports: ["glb"],
    priceSource: "https://www.sloyd.ai/api/pricing",
    priceVerifiedAt: "2026-11-05",
    priceEvidence: "published",
    price: (q) => [{ code: "generation", usd: round(providerCreditsEstimate(q.texture, q.mode) / PROVIDER_CREDITS_PER_USD) }],
  },
  {
    id: "fal-hunyuan-3.1-pro",
    provider: "fal",
    label: "Hunyuan3D 3.1 Pro",
    lifecycle: "disabled",
    modes: ["image", "multi-image"],
    maxPhotos: 4,
    views: ["front", "left", "back", "right"],
    geometryOnly: true,
    exports: ["glb", "obj"],
    priceSource: "https://fal.ai/models/fal-ai/hunyuan-3d/v3.1/pro/image-to-3d",
    priceVerifiedAt: "2026-11-05",
    priceEvidence: "published",
    price: (q) => {
      const lines: PriceLine[] = [{ code: "generation", usd: 0.375 }];
      if (q.texture !== "none") lines.push({ code: "texture", usd: 0.15 });
      if (q.photoCount >= 2) lines.push({ code: "multi_view", usd: 0.15 });
      // The adapter always sends face_count, which the vendor lists as a paid add-on: priced in until an invoice says otherwise.
      lines.push({ code: "detail", usd: 0.15 });
      return lines;
    },
    fal: {
      endpoint: "fal-ai/hunyuan-3d/v3.1/pro/image-to-3d",
      buildInput: (req) => {
        const p = photosOf(req);
        const textured = req.textureResolution !== "none";
        return {
          input_image_url: p.front && dataUri(p.front),
          ...(p.back ? { back_image_url: dataUri(p.back) } : {}),
          ...(p.left ? { left_image_url: dataUri(p.left) } : {}),
          ...(p.right ? { right_image_url: dataUri(p.right) } : {}),
          generate_type: textured ? "Normal" : "Geometry",
          enable_pbr: textured,
          face_count: FACE_TARGET,
        };
      },
      glbUrl: hunyuanGlb,
    },
  },
  {
    id: "fal-hunyuan-3.1-rapid",
    provider: "fal",
    label: "Hunyuan3D 3.1 Rapid",
    lifecycle: "disabled",
    modes: ["image"],
    maxPhotos: 1,
    views: ["front"],
    geometryOnly: true,
    exports: ["glb", "obj"],
    priceSource: "https://fal.ai/models/fal-ai/hunyuan-3d/v3.1/rapid/image-to-3d",
    priceVerifiedAt: "2026-11-05",
    priceEvidence: "published",
    price: (q) => {
      const lines: PriceLine[] = [{ code: "generation", usd: 0.225 }];
      if (q.texture !== "none") lines.push({ code: "texture", usd: 0.15 });
      return lines;
    },
    fal: {
      endpoint: "fal-ai/hunyuan-3d/v3.1/rapid/image-to-3d",
      buildInput: (req) => {
        const p = photosOf(req);
        const textured = req.textureResolution !== "none";
        return { input_image_url: p.front && dataUri(p.front), enable_geometry: !textured, enable_pbr: textured };
      },
      glbUrl: hunyuanGlb,
    },
  },
  {
    id: "fal-rodin-2.5",
    provider: "fal",
    label: "Rodin 2.5",
    lifecycle: "disabled",
    modes: ["image", "multi-image"],
    maxPhotos: 4, // the endpoint takes 5 unlabelled images; OrbitShelf collects 4 views
    views: ["front", "left", "back", "right"],
    geometryOnly: true,
    exports: ["glb", "usdz", "fbx", "obj", "stl"],
    priceSource: "https://fal.ai/models/fal-ai/hyper3d/rodin/v2.5",
    priceVerifiedAt: "2026-11-05",
    priceEvidence: "published",
    price: () => [{ code: "generation", usd: 0.4 }],
    fal: {
      endpoint: "fal-ai/hyper3d/rodin/v2.5",
      buildInput: (req) => {
        const p = photosOf(req);
        return {
          image_urls: IMAGE_VIEWS.flatMap((v) => (p[v] ? [dataUri(p[v]!)] : [])),
          geometry_file_format: "glb",
          material: req.textureResolution === "none" ? "None" : "PBR",
        };
      },
      glbUrl: (o) => fileUrl((o as { model_mesh?: unknown }).model_mesh),
    },
  },
  {
    id: "fal-rodin-2.5-fast",
    provider: "fal",
    label: "Rodin 2.5 Fast",
    lifecycle: "disabled",
    modes: ["image", "multi-image"],
    maxPhotos: 4,
    views: ["front", "left", "back", "right"],
    geometryOnly: true,
    exports: ["glb", "usdz", "fbx", "obj", "stl"],
    priceSource: "https://fal.ai/models/fal-ai/hyper3d/rodin/v2.5/fast",
    priceVerifiedAt: "2026-11-05",
    priceEvidence: "published",
    price: () => [{ code: "generation", usd: 0.1 }],
    fal: {
      endpoint: "fal-ai/hyper3d/rodin/v2.5/fast",
      buildInput: (req) => {
        const p = photosOf(req);
        return {
          image_urls: IMAGE_VIEWS.flatMap((v) => (p[v] ? [dataUri(p[v]!)] : [])),
          geometry_file_format: "glb",
          material: req.textureResolution === "none" ? "None" : "PBR",
        };
      },
      glbUrl: (o) => fileUrl((o as { model_mesh?: unknown }).model_mesh),
    },
  },
  {
    id: "fal-tripo-h3.1",
    provider: "fal",
    label: "Tripo H3.1",
    lifecycle: "disabled",
    modes: ["image"],
    maxPhotos: 1,
    views: ["front"],
    geometryOnly: true,
    exports: ["glb"],
    priceSource: "https://fal.ai/models/tripo3d/h3.1/image-to-3d",
    priceVerifiedAt: "2026-11-05",
    priceEvidence: "published",
    price: (q) => [{ code: "generation", usd: q.texture === "none" ? 0.2 : q.texture === "2k" ? 0.4 : 0.3 }],
    fal: {
      endpoint: "tripo3d/h3.1/image-to-3d",
      buildInput: (req) => {
        const p = photosOf(req);
        const textured = req.textureResolution !== "none";
        return {
          image_url: p.front && dataUri(p.front),
          texture: textured,
          pbr: textured,
          texture_quality: req.textureResolution === "2k" ? "detailed" : "standard",
          geometry_quality: "standard", // "detailed" costs US$0.20 more
          quad: false, // quads cost US$0.05 more
          face_limit: FACE_TARGET,
        };
      },
      glbUrl: (o) => fileUrl((o as { model_urls?: { glb?: unknown } }).model_urls?.glb),
    },
  },
  {
    id: "fal-trellis-2",
    provider: "fal",
    label: "TRELLIS.2",
    lifecycle: "disabled",
    modes: ["image"],
    maxPhotos: 1,
    views: ["front"],
    geometryOnly: false,
    exports: ["glb"],
    priceSource: "https://fal.ai/models/fal-ai/trellis-2",
    priceVerifiedAt: "2026-11-05",
    priceEvidence: "published",
    price: () => [{ code: "generation", usd: 0.3 }],
    fal: {
      endpoint: "fal-ai/trellis-2",
      buildInput: (req) => {
        const p = photosOf(req);
        return { image_url: p.front && dataUri(p.front), resolution: "1024", decimation_target: FACE_TARGET };
      },
      glbUrl: (o) => fileUrl((o as { model_glb?: unknown }).model_glb),
    },
  },
  {
    id: "fal-trellis-1",
    provider: "fal",
    label: "TRELLIS",
    lifecycle: "disabled",
    modes: ["image"],
    maxPhotos: 1,
    views: ["front"],
    geometryOnly: false,
    exports: ["glb"],
    priceSource: "https://fal.ai/models/fal-ai/trellis",
    priceVerifiedAt: "2026-11-05",
    priceEvidence: "published",
    price: () => [{ code: "generation", usd: 0.02 }],
    fal: {
      endpoint: "fal-ai/trellis",
      buildInput: (req) => {
        const p = photosOf(req);
        return { image_url: p.front && dataUri(p.front), texture_size: req.textureResolution === "2k" ? "2048" : req.textureResolution === "512" ? "512" : "1024" };
      },
      // fal's sample shows a PNG here. The bytes are validated as a GLB before anything is stored, so a wrong format fails the job.
      glbUrl: (o) => fileUrl((o as { model_mesh?: unknown }).model_mesh),
    },
  },
  {
    id: "meshy-7.1",
    provider: "meshy",
    label: "Meshy 7.1",
    lifecycle: "disabled",
    modes: ["image"],
    maxPhotos: 1,
    views: ["front"],
    geometryOnly: true,
    exports: ["glb", "obj", "fbx", "stl", "usdz"],
    priceSource: "https://docs.meshy.ai/en/api/pricing",
    priceVerifiedAt: "2026-11-05",
    priceEvidence: "published",
    price: (q) => [{ code: "generation", usd: round((q.texture === "none" ? 20 : 30) * MESHY_USD_PER_CREDIT) }],
    meshy: { aiModel: "meshy-7.1" },
  },
];

const ADAPTERS: Record<ProviderId, ModelAdapter> = { sloyd: sloydAdapter, fal: falAdapter, meshy: meshyAdapter };

export const adapterFor = (engine: EngineDefinition): ModelAdapter => ADAPTERS[engine.provider];

const listEnv = (name: string) => (process.env[name] ?? "").split(",").map((s) => s.trim()).filter(Boolean);

let switchedOff = new Set<string>();
/** Set from the `engine_switches` table. It can only turn engines off. */
export const setSwitchedOffEngines = (ids: string[]) => {
  switchedOff = new Set(ids);
};

/** ENGINES_DISABLED and the database switch both turn an engine off. ENGINES_ENABLED pilots a disabled engine; it can never override them. */
function effectiveLifecycle(engine: EngineDefinition): EngineDefinition["lifecycle"] {
  if (switchedOff.has(engine.id) || listEnv("ENGINES_DISABLED").includes(engine.id)) return "disabled";
  if (engine.lifecycle === "disabled" && listEnv("ENGINES_ENABLED").includes(engine.id)) return "pilot";
  return engine.lifecycle;
}

export const getEngine = (id: string): EngineDefinition | null => ENGINES.find((e) => e.id === id) ?? null;
export const allEngines = (): readonly EngineDefinition[] => ENGINES;
export const engineEnabled = (engine: EngineDefinition) => effectiveLifecycle(engine) !== "disabled";

/** Offered to users: enabled and with credentials on the server. */
export const availableEngines = (deps?: Deps): EngineDefinition[] => ENGINES.filter((e) => engineEnabled(e) && adapterFor(e).isConfigured(deps));

export function toEngineDto(engine: EngineDefinition): EngineDto {
  return {
    id: engine.id,
    label: engine.label,
    lifecycle: effectiveLifecycle(engine),
    modes: engine.modes,
    maxPhotos: engine.maxPhotos,
    views: engine.views,
    geometryOnly: engine.geometryOnly,
    exports: engine.exports,
    priceVerifiedAt: engine.priceVerifiedAt,
    priceEvidence: engine.priceEvidence,
    fromPriceUsd: priceOf(engine, { mode: engine.modes[0], photoCount: engine.modes[0] === "text" ? 0 : 1, texture: "1k" }).usd,
  };
}

export type CapabilityProblem = "mode" | "photos" | "views" | "texture";

/** A request the engine cannot honour is rejected before anything is charged, never silently reduced. */
export function capabilityProblem(engine: EngineDefinition, q: PriceQuery & { views?: ImageView[] }): CapabilityProblem | null {
  if (!engine.modes.includes(q.mode)) return "mode";
  if (q.mode !== "text" && q.photoCount > engine.maxPhotos) return "photos";
  if (q.views?.some((v) => !engine.views.includes(v))) return "views";
  if (q.texture === "none" && !engine.geometryOnly) return "texture";
  return null;
}

export const priceOf = (engine: EngineDefinition, q: PriceQuery) => {
  const lines = engine.price(q);
  return { lines, usd: round(lines.reduce((n, l) => n + l.usd, 0)) };
};

export type { TextureResolution };

/**
 * What the plan cards use to translate credits into models: the cheapest and the dearest path among the engines that are
 * switched on (lifecycle), with textures and one photo. Disabled engines never widen the range the public page promises.
 */
export function planReference() {
  const live = ENGINES.filter((e) => engineEnabled(e));
  const pool = live.length ? live : ENGINES;
  const credits = pool.map((e) => creditsFor(priceOf(e, { mode: "image", photoCount: 1, texture: "1k" }).usd));
  return { economy: Math.min(...credits), premium: Math.max(...credits) };
}
