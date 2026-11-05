import type { ModelDto } from "@/lib/types";

/** Pure filter shared by the API route and the library UI. */
export type ModelFilters = { q?: string; status?: string; source?: string; review?: string; project?: string; tag?: string; favorite?: string | boolean; engine?: string };

export function filterModels<T extends ModelDto>(models: T[], f: ModelFilters): T[] {
  const text = (f.q ?? "").trim().toLowerCase();
  return models.filter(
    (m) =>
      (!text || m.title.toLowerCase().includes(text) || (m.sku ?? "").toLowerCase().includes(text) || m.tags.some((t) => t.toLowerCase().includes(text))) &&
      (!f.project || m.projectId === f.project) &&
      (!f.tag || m.tags.includes(f.tag)) &&
      (!f.favorite || m.favorite) &&
      (!f.engine || m.engineId === f.engine) &&
      (!f.status || m.status === f.status) &&
      (!f.source || m.source === f.source) &&
      (!f.review || m.reviewState === f.review),
  );
}
