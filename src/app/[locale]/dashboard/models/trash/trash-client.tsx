"use client";

import { useState } from "react";
import Link from "next/link";
import { localePath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale, ModelDto } from "@/lib/types";
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
        <p className="text-sm text-muted" data-testid="trash-empty">{c.empty}</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line" data-testid="trash-list">
          {models.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs">
              <div>
                <div className="font-semibold text-fg">{m.title}</div>
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
