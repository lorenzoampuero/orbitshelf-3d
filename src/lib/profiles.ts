import type { EngineDto, Experience, GenerationPreset, Goal, InputKind, TextureResolution, UseCase, UserProfile } from "@/lib/types";

/**
 * Versioned rules that decide what is highlighted for each kind of user. They change order and defaults only:
 * every tool stays reachable from every workspace, and nothing here touches permissions, balance or accounting.
 */
export const PROFILE_RULES_VERSION = 1;

export const GOALS_BY_USE_CASE: Record<UseCase, Goal[]> = {
  commerce: ["photos", "publish", "text"],
  game: ["text", "photos", "assets"],
  pro: ["assets", "photos", "text"],
  explore: ["photos", "text"],
};

export const SHORTCUTS = {
  createPhotos: "/dashboard/create?mode=photos",
  createText: "/dashboard/create?mode=text",
  importGlb: "/dashboard/create?mode=import",
  library: "/dashboard/models",
  explore: "/dashboard/explore",
  embeds: "/dashboard/embeds",
  usage: "/dashboard/usage",
} as const;
export type ShortcutId = keyof typeof SHORTCUTS;

const WORKSPACE_SHORTCUTS: Record<UseCase, ShortcutId[]> = {
  commerce: ["createPhotos", "library", "embeds", "explore"],
  game: ["createText", "importGlb", "library", "explore"],
  pro: ["explore", "importGlb", "library", "createPhotos"],
  explore: ["explore", "createPhotos", "createText", "importGlb"],
};

const DEFAULT_SHORTCUTS: ShortcutId[] = ["createPhotos", "createText", "importGlb", "explore"];

/** The workspace in view: what the user switched to, otherwise their answer. */
export const activeWorkspace = (p: UserProfile | null): UseCase | null => p?.activeWorkspace ?? p?.useCase ?? null;

export function shortcutsFor(workspace: UseCase | null, goal: Goal | null = null): ShortcutId[] {
  const base = workspace ? WORKSPACE_SHORTCUTS[workspace] : DEFAULT_SHORTCUTS;
  const first: ShortcutId | null = goal === "photos" ? "createPhotos" : goal === "text" ? "createText" : goal === "assets" ? "importGlb" : goal === "publish" ? "embeds" : null;
  if (!first) return base;
  return [first, ...base.filter((s) => s !== first)];
}

/** A beginner is never dropped into manual controls; someone advanced starts there. Without an answer, nothing is assumed and all controls show. */
export function defaultPreset(workspace: UseCase | null, experience: Experience | null): GenerationPreset {
  if (experience === "advanced") return "advanced";
  if (workspace === "commerce") return "studio";
  if (workspace === "game") return "game";
  if (workspace === "explore") return "fast";
  if (workspace === "pro") return experience === "beginner" ? "studio" : "advanced";
  return "advanced";
}

export function defaultMode(goal: Goal | null): "photos" | "text" | "import" | null {
  if (goal === "photos") return "photos";
  if (goal === "text") return "text";
  if (goal === "assets") return "import";
  return null;
}

export type ResolvedPreset = { engineId: string; texture: TextureResolution };

/**
 * Presets choose by what is known today: published price and real capabilities. No engine has been compared with real generations,
 * so none of them claims better quality. Once there are benchmark results, this is where they belong.
 * Returns null for `advanced` (the user chooses) and when no available engine can do the job.
 */
export function resolvePreset(preset: GenerationPreset, engines: EngineDto[], mode: InputKind, photoCount: number): ResolvedPreset | null {
  if (preset === "advanced") return null;
  const usable = engines.filter((e) => e.modes.includes(mode) && (mode === "text" || photoCount <= e.maxPhotos));
  if (usable.length === 0) return null;
  const cheapest = (list: EngineDto[]) => [...list].sort((a, b) => a.fromCredits - b.fromCredits || a.id.localeCompare(b.id))[0];
  if (preset === "studio") {
    const mostViews = Math.max(...usable.map((e) => e.maxPhotos));
    return { engineId: cheapest(usable.filter((e) => e.maxPhotos === mostViews)).id, texture: "2k" };
  }
  return { engineId: cheapest(usable).id, texture: "1k" };
}
