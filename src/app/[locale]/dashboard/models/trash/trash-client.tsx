"use client";

import { useState } from "react";
import Link from "next/link";
import { Boxes } from "lucide-react";
import { localePath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale, ModelDto } from "@/lib/types";
import { examplePoster } from "@/content/examples";
import { formatDate } from "@/lib/utils";

export function TrashClient({ locale, dict, initial }: { locale: Locale; dict: Dictionary; initial: ModelDto[] }) {
  const c = dict.dash.trash;
  const [models, setModels] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  async function act(id: string, url: string, method: "POST" | "DELETE") {
    setError(null);
    const res = await fetch(url, { method }).catch(() => null);
    if (res?.ok) setModels((prev) => prev.filter((m) => m.id !== id));
    else setError(dict.common.somethingWrong);
  }

  return (
    <div className="space-y-4">
      <Link href={localePath(locale, "/dashboard/models")} className="text-xs font-medium text-accent hover:underline">
        ← {dict.dash.nav.models}
      </Link>
      <p className="text-xs text-muted">{c.note}</p>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      {models.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-surface-1 p-10 text-center">
          <Boxes aria-hidden="true" className="mx-auto mb-3 h-10 w-10 text-muted opacity-40" />
          <p className="text-sm text-muted" data-testid="trash-empty">{c.empty}</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4" data-testid="trash-list">
          {models.map((m) => (
            <li key={m.id} className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-1 text-xs">
              <div className="p-4 pb-0">
                {m.hasThumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element -- private, authenticated image: the optimizer cannot fetch it
                  <img src={`/api/models/${encodeURIComponent(m.id)}/thumbnail`} alt="" loading="lazy" className="aspect-square w-full rounded-xl bg-stage object-contain opacity-70" />
                ) : m.demoAsset ? (
                  // eslint-disable-next-line @next/next/no-img-element -- small static poster of a bundled sample
                  <img src={examplePoster(m.demoAsset)} alt="" loading="lazy" className="aspect-square w-full rounded-xl bg-stage object-contain opacity-70" />
                ) : (
                  <div aria-hidden="true" className="flex aspect-square w-full items-center justify-center rounded-xl bg-stage text-muted">
                    <Boxes className="h-10 w-10 opacity-40" />
                  </div>
                )}
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <div className="text-sm font-semibold text-fg">{m.title}</div>
                  <div className="text-muted">{c.deletedOn.replace("{date}", m.deletedAt ? formatDate(m.deletedAt, locale) : "")}</div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => act(m.id, `/api/models/${encodeURIComponent(m.id)}/restore`, "POST")} data-testid={`trash-restore-${m.id}`} className="rounded-xl border border-line bg-bg px-3 py-1.5 font-medium text-fg hover:border-accent">
                    {c.restore}
                  </button>
                  <button type="button" onClick={() => act(m.id, `/api/models/${encodeURIComponent(m.id)}?permanent=1`, "DELETE")} data-testid={`trash-purge-${m.id}`} className="rounded-xl border border-line bg-bg px-3 py-1.5 font-medium text-danger hover:border-danger">
                    {c.purge}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
