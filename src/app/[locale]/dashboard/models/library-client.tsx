"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { localePath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale, ModelDto, ModelStatus, ModelSource, ReviewState } from "@/lib/types";
import { filterModels } from "@/lib/model-filter";
import { formatBytes, formatDate } from "@/lib/utils";

export function LibraryClient({
  locale,
  t,
  initialModels,
}: {
  locale: Locale;
  t: Dictionary;
  initialModels: ModelDto[];
}) {
  const [models, setModels] = useState<ModelDto[]>(initialModels);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ModelStatus | "">("");
  const [source, setSource] = useState<ModelSource | "">("");
  const [review, setReview] = useState<ReviewState | "">("");
  const [deleteTarget, setDeleteTarget] = useState<ModelDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(
    () =>
      filterModels(models, {
        q: query,
        status: status || undefined,
        source: source || undefined,
        review: review || undefined,
      }),
    [models, query, status, source, review],
  );

  function clearFilters() {
    setQuery("");
    setStatus("");
    setSource("");
    setReview("");
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/models/${encodeURIComponent(deleteTarget.id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setModels((prev) => prev.filter((m) => m.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">{t.dash.library.title}</h1>
          <p className="mt-1 text-sm text-muted">{t.dash.library.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/export/jobs.csv"
            data-testid="library-export-csv"
            className="rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-medium text-fg hover:border-mint"
          >
            {t.dash.library.exportCsv}
          </a>
          <Link
            href={localePath(locale, "/dashboard/create")}
            className="rounded-xl bg-mint px-4 py-2 text-xs font-semibold text-bg hover:bg-mint-strong"
          >
            {t.dash.library.create}
          </Link>
        </div>
      </div>

      <div className="grid gap-3 rounded-[14px] border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label htmlFor="lib-search" className="block text-xs font-medium text-muted">
            {t.dash.library.search}
          </label>
          <input
            id="lib-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.dash.library.search}
            data-testid="library-search"
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg"
          />
        </div>
        <div>
          <label htmlFor="lib-status" className="block text-xs font-medium text-muted">
            {t.dash.library.filterStatus}
          </label>
          <select
            id="lib-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ModelStatus | "")}
            data-testid="library-filter-status"
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg"
          >
            <option value="">{t.dash.library.all}</option>
            {(["processing", "ready", "failed"] as ModelStatus[]).map((k) => (
              <option key={k} value={k}>
                {t.dash.status[k]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="lib-source" className="block text-xs font-medium text-muted">
            {t.dash.library.filterSource}
          </label>
          <select
            id="lib-source"
            value={source}
            onChange={(e) => setSource(e.target.value as ModelSource | "")}
            data-testid="library-filter-source"
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg"
          >
            <option value="">{t.dash.library.all}</option>
            {(["demo", "sloyd"] as ModelSource[]).map((k) => (
              <option key={k} value={k}>
                {t.dash.source[k]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="lib-review" className="block text-xs font-medium text-muted">
            {t.dash.library.filterReview}
          </label>
          <select
            id="lib-review"
            value={review}
            onChange={(e) => setReview(e.target.value as ReviewState | "")}
            data-testid="library-filter-review"
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg"
          >
            <option value="">{t.dash.library.all}</option>
            {(["pending", "approved", "rejected"] as ReviewState[]).map((k) => (
              <option key={k} value={k}>
                {t.dash.review[k]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>{t.dash.library.count.replace("{n}", String(filtered.length))}</span>
        {(query || status || source || review) && (
          <button
            type="button"
            onClick={clearFilters}
            className="font-medium text-mint hover:underline"
          >
            {t.dash.library.clearFilters}
          </button>
        )}
      </div>

      {models.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-line bg-surface p-10 text-center">
          <h2 className="font-display text-base font-semibold text-fg">{t.dash.library.emptyTitle}</h2>
          <p className="mt-1 text-sm text-muted">{t.dash.library.emptyText}</p>
          <Link
            href={localePath(locale, "/dashboard/create")}
            className="mt-4 inline-flex rounded-xl bg-mint px-4 py-2 text-xs font-semibold text-bg"
          >
            {t.dash.library.create}
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-line bg-surface p-10 text-center">
          <h2 className="font-display text-base font-semibold text-fg">{t.dash.library.noResultsTitle}</h2>
          <p className="mt-1 text-sm text-muted">{t.dash.library.noResultsText}</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 rounded-xl border border-line bg-bg px-4 py-2 text-xs font-medium text-fg hover:border-mint"
          >
            {t.dash.library.clearFilters}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="library-grid">
          {filtered.map((m) => (
            <article
              key={m.id}
              data-testid={`model-card-${m.id}`}
              className="flex flex-col justify-between rounded-[16px] border border-line bg-surface p-5"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-mint">
                    {t.dash.provenance[m.provenance]}
                  </span>
                  <span className="rounded-full border border-line bg-bg px-2.5 py-0.5 text-xs font-medium text-fg">
                    {t.dash.status[m.status]}
                  </span>
                </div>
                <h2 className="mt-3 font-display text-base font-semibold text-fg">{m.title}</h2>
                <p className="mt-0.5 text-xs text-muted">
                  {m.sku ? `${m.sku} · ` : ""}
                  {t.dash.categories[m.category]}
                </p>
                <dl className="mt-4 space-y-1 text-xs text-muted">
                  <div className="flex justify-between">
                    <dt>{t.dash.library.columns.source}</dt>
                    <dd className="font-medium text-fg">{t.dash.source[m.source]}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>{t.dash.library.columns.review}</dt>
                    <dd className="font-medium text-fg">{t.dash.review[m.reviewState]}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>{t.dash.library.columns.created}</dt>
                    <dd>{formatDate(m.createdAt, locale)}</dd>
                  </div>
                  {m.fileSize !== null && (
                    <div className="flex justify-between">
                      <dt>{t.dash.detail.sizeLabel}</dt>
                      <dd>{formatBytes(m.fileSize)}</dd>
                    </div>
                  )}
                </dl>
              </div>
              <div className="mt-5 flex items-center justify-between gap-2 border-t border-line pt-3">
                <Link
                  href={localePath(locale, `/dashboard/models/${m.id}`)}
                  data-testid={`open-model-${m.id}`}
                  className="rounded-xl bg-mint px-3.5 py-1.5 text-xs font-semibold text-bg hover:bg-mint-strong"
                >
                  {t.dash.library.open}
                </Link>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(m)}
                  data-testid={`delete-model-${m.id}`}
                  className="rounded-xl border border-line px-3 py-1.5 text-xs font-medium text-danger hover:border-danger"
                >
                  {t.dash.detail.delete}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="del-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-md rounded-[16px] border border-line bg-surface p-6 shadow-xl">
            <h2 id="del-modal-title" className="font-display text-base font-semibold text-fg">
              {t.dash.library.deleteTitle}
            </h2>
            <p className="mt-1 text-xs font-medium text-mint">{deleteTarget.title}</p>
            <p className="mt-2 text-sm text-muted">{t.dash.library.deleteText}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-line bg-bg px-4 py-2 text-xs font-medium text-fg hover:border-mint"
              >
                {t.dash.create.back}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                data-testid="confirm-delete-model"
                className="rounded-xl bg-danger px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {deleting ? t.dash.library.deleting : t.dash.library.deleteConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
