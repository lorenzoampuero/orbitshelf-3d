"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { localePath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale, ModelDto, ModelStatus, ModelSource, ProjectDto, ReviewState } from "@/lib/types";
import { filterModels } from "@/lib/model-filter";
import { Boxes } from "lucide-react";
import { examplePoster } from "@/content/examples";
import { formatBytes, formatDate } from "@/lib/utils";

export function LibraryClient({
  locale,
  t,
  initialModels,
  initialProjects,
  initialQuery = "",
}: {
  locale: Locale;
  t: Dictionary;
  initialModels: ModelDto[];
  initialProjects: ProjectDto[];
  /** Pre-fills the search box (the top bar's search sends ?q=). */
  initialQuery?: string;
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [project, setProject] = useState("");
  const [tag, setTag] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [newProject, setNewProject] = useState("");
  const [models, setModels] = useState<ModelDto[]>(initialModels);
  const [query, setQuery] = useState(initialQuery);
  const [view, setView] = useState<"grid" | "list">("grid");
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
        project: project || undefined,
        tag: tag || undefined,
        favorite: favoritesOnly,
      }),
    [models, query, status, source, review, project, tag, favoritesOnly],
  );
  const allTags = useMemo(() => [...new Set(models.flatMap((m) => m.tags))].sort(), [models]);

  async function addProject(e: React.FormEvent) {
    e.preventDefault();
    const name = newProject.trim();
    if (!name) return;
    const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) }).catch(() => null);
    const body = res?.ok ? await res.json().catch(() => null) : null;
    if (body?.project) {
      setProjects((prev) => [...prev, body.project]);
      setNewProject("");
    }
  }

  async function toggleFavorite(m: ModelDto) {
    const res = await fetch(`/api/models/${encodeURIComponent(m.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ favorite: !m.favorite }) }).catch(() => null);
    if (res?.ok) setModels((prev) => prev.map((x) => (x.id === m.id ? { ...x, favorite: !m.favorite } : x)));
  }

  function clearFilters() {
    setQuery("");
    setStatus("");
    setSource("");
    setReview("");
    setProject("");
    setTag("");
    setFavoritesOnly(false);
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
            className="rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-medium text-fg hover:border-accent"
          >
            {t.dash.library.exportCsv}
          </a>
          <Link
            href={localePath(locale, "/dashboard/create")}
            className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-bg hover:bg-accent-strong"
          >
            {t.dash.library.create}
          </Link>
        </div>
      </div>

      <div className="grid gap-3 rounded-[var(--radius-card)] border border-line bg-surface-1 p-4 sm:grid-cols-2 lg:grid-cols-5">
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
            {(["demo", "ai", "import"] as ModelSource[]).map((k) => (
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

      <div className="flex flex-wrap items-end gap-3 rounded-[var(--radius-card)] border border-line bg-surface-1 px-4 py-3 text-xs">
        <div>
          <label htmlFor="lib-project" className="block font-medium text-muted">{t.dash.library.project}</label>
          <select id="lib-project" value={project} onChange={(e) => setProject(e.target.value)} data-testid="library-filter-project" className="mt-1 rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg">
            <option value="">{t.dash.library.all}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        {allTags.length > 0 && (
          <div>
            <label htmlFor="lib-tag" className="block font-medium text-muted">{t.dash.library.tag}</label>
            <select id="lib-tag" value={tag} onChange={(e) => setTag(e.target.value)} data-testid="library-filter-tag" className="mt-1 rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg">
              <option value="">{t.dash.library.all}</option>
              {allTags.map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </div>
        )}
        <label className="flex cursor-pointer items-center gap-2 py-2 text-fg">
          <input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} data-testid="library-filter-favorites" />
          {t.dash.library.favoritesOnly}
        </label>
        <form onSubmit={addProject} className="ml-auto flex items-end gap-2">
          <div>
            <label htmlFor="lib-new-project" className="block font-medium text-muted">{t.dash.library.newProject}</label>
            <input id="lib-new-project" value={newProject} maxLength={60} onChange={(e) => setNewProject(e.target.value)} data-testid="library-new-project" className="mt-1 rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg" />
          </div>
          <button type="submit" data-testid="library-add-project" className="rounded-xl border border-line bg-bg px-3 py-2 font-medium text-fg hover:border-accent">{t.dash.library.addProject}</button>
        </form>
        <Link href={localePath(locale, "/dashboard/models/trash")} data-testid="library-trash-link" className="py-2 font-medium text-accent hover:underline">{t.dash.trash.title}</Link>
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span className="flex items-center gap-3">
          {t.dash.library.count.replace("{n}", String(filtered.length))}
          <span role="group" aria-label={locale === "es" ? "Vista" : "View"} className="inline-flex overflow-hidden rounded-full border border-line">
            {(["grid", "list"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                data-testid={`library-view-${v}`}
                className={`px-3 py-1 font-medium ${view === v ? "bg-accent-fill text-white" : "text-muted hover:text-fg"}`}
              >
                {v === "grid" ? (locale === "es" ? "Cuadrícula" : "Grid") : locale === "es" ? "Lista" : "List"}
              </button>
            ))}
          </span>
        </span>
        {(query || status || source || review || project || tag || favoritesOnly) && (
          <button
            type="button"
            onClick={clearFilters}
            className="font-medium text-accent hover:underline"
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
            className="mt-4 inline-flex rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-bg"
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
            className="mt-4 rounded-xl border border-line bg-bg px-4 py-2 text-xs font-medium text-fg hover:border-accent"
          >
            {t.dash.library.clearFilters}
          </button>
        </div>
      ) : (
        <div data-view={view} className={`group/lib grid gap-4 ${view === "list" ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"}`} data-testid="library-grid">
          {filtered.map((m) => (
            <article
              key={m.id}
              data-testid={`model-card-${m.id}`}
              className="group flex flex-col justify-between overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-1 transition-[border-color,transform] duration-[var(--t-control)] hover:-translate-y-0.5 hover:border-line-strong"
            >
              <div className="p-4 pb-0">
                {m.hasThumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element -- private, authenticated image: the optimizer cannot fetch it
                  <img src={`/api/models/${encodeURIComponent(m.id)}/thumbnail`} alt="" loading="lazy" className="group-data-[view=list]/lib:hidden mb-3 aspect-square w-full rounded-xl bg-stage object-contain transition-transform duration-[var(--t-panel)] group-hover:scale-[1.03]" data-testid={`model-thumb-${m.id}`} />
                ) : m.demoAsset ? (
                  // eslint-disable-next-line @next/next/no-img-element -- small static poster of a bundled sample
                  <img src={examplePoster(m.demoAsset)} alt="" loading="lazy" className="group-data-[view=list]/lib:hidden mb-3 aspect-square w-full rounded-xl bg-stage object-contain transition-transform duration-[var(--t-panel)] group-hover:scale-[1.03]" />
                ) : (
                  <div aria-hidden="true" className="group-data-[view=list]/lib:hidden mb-3 flex aspect-square w-full items-center justify-center rounded-xl bg-stage text-muted">
                    <Boxes className="h-10 w-10 opacity-40" />
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-accent">
                    {t.dash.provenance[m.provenance]}
                  </span>
                  <span className="rounded-full border border-line bg-bg px-2.5 py-0.5 text-xs font-medium text-fg">
                    {t.dash.status[m.status]}
                  </span>
                  <button type="button" aria-pressed={m.favorite} aria-label={t.dash.library.favorite} onClick={() => toggleFavorite(m)} data-testid={`favorite-${m.id}`} className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${m.favorite ? "border-accent text-accent" : "border-line text-muted hover:border-accent"}`}>
                    {m.favorite ? t.dash.library.favoriteOn : t.dash.library.favorite}
                  </button>
                </div>
                <h2 className="mt-3 font-display text-base font-semibold text-fg">{m.title}</h2>
                <p className="mt-0.5 text-xs text-muted">
                  {m.sku ? `${m.sku} · ` : ""}
                  {t.dash.categories[m.category]}
                  {m.projectId ? ` · ${projects.find((p) => p.id === m.projectId)?.name ?? ""}` : ""}
                </p>
                {m.tags.length > 0 && <p className="mt-1 text-xs text-muted">{m.tags.join(", ")}</p>}
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
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-line p-4">
                <Link
                  href={localePath(locale, `/dashboard/models/${m.id}`)}
                  data-testid={`open-model-${m.id}`}
                  className="rounded-xl bg-accent px-3.5 py-1.5 text-xs font-semibold text-bg hover:bg-accent-strong"
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
          <div className="w-full max-w-md rounded-[var(--radius-card)] border border-line bg-surface-1 p-6 shadow-xl">
            <h2 id="del-modal-title" className="font-display text-base font-semibold text-fg">
              {t.dash.library.deleteTitle}
            </h2>
            <p className="mt-1 text-xs font-medium text-accent">{deleteTarget.title}</p>
            <p className="mt-2 text-sm text-muted">{t.dash.library.deleteText}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-line bg-bg px-4 py-2 text-xs font-medium text-fg hover:border-accent"
              >
                {t.dash.create.back}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                data-testid="confirm-delete-model"
                className="rounded-xl bg-danger px-4 py-2 text-xs font-semibold text-ink disabled:opacity-50"
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
