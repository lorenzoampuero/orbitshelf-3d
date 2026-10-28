import type { ModelDto } from "@/lib/types";

/** Pure filter shared by the API route and the library UI. */
export type ModelFilters = { q?: string; status?: string; source?: string; review?: string };

export function filterModels<T extends ModelDto>(models: T[], f: ModelFilters): T[] {
  const text = (f.q ?? "").trim().toLowerCase();
  return models.filter(
    (m) =>
      (!text || m.title.toLowerCase().includes(text) || (m.sku ?? "").toLowerCase().includes(text)) &&
      (!f.status || m.status === f.status) &&
      (!f.source || m.source === f.source) &&
      (!f.review || m.reviewState === f.review),
  );
}
