"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { localePath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import {
  CATEGORIES,
  CHECKLIST_KEYS,
  type Category,
  type Checklist,
  type ChecklistKey,
  type Locale,
  type ModelDto,
} from "@/lib/types";
import { ModelViewerBox } from "@/components/model-viewer-box";
import { formatBytes, formatDate } from "@/lib/utils";

export function StudioClient({
  locale,
  t,
  initialModel,
}: {
  locale: Locale;
  t: Dictionary;
  initialModel: ModelDto;
}) {
  const router = useRouter();
  const [model, setModel] = useState<ModelDto>(initialModel);
  const [checklist, setChecklist] = useState<Checklist>(initialModel.checklist);
  const [reviewNote, setReviewNote] = useState<string>(initialModel.reviewNote ?? "");
  const [savingReview, setSavingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [title, setTitle] = useState(initialModel.title);
  const [sku, setSku] = useState(initialModel.sku ?? "");
  const [category, setCategory] = useState<Category>(initialModel.category);
  const [widthMm, setWidthMm] = useState(
    initialModel.dimensions.widthMm ? String(initialModel.dimensions.widthMm) : "",
  );
  const [heightMm, setHeightMm] = useState(
    initialModel.dimensions.heightMm ? String(initialModel.dimensions.heightMm) : "",
  );
  const [depthMm, setDepthMm] = useState(
    initialModel.dimensions.depthMm ? String(initialModel.dimensions.depthMm) : "",
  );
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaSaved, setMetaSaved] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const refreshStatus = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/models/${encodeURIComponent(model.id)}/refresh`, {
        method: "POST",
      });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.model) {
        const updated: ModelDto = body.model;
        setModel(updated);
        setChecklist(updated.checklist);
        setReviewNote(updated.reviewNote ?? "");
      }
    } finally {
      setRefreshing(false);
    }
  }, [model.id]);

  useEffect(() => {
    if (model.status !== "processing") return;
    const interval = setInterval(() => {
      void refreshStatus();
    }, 2000);
    return () => clearInterval(interval);
  }, [model.status, refreshStatus]);

  const allChecked = CHECKLIST_KEYS.every((k) => checklist[k] === true);
  const hasFile = model.status === "ready";

  function toggleChecklist(key: ChecklistKey) {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function submitReview(decision: "approve" | "reject" | "reset" | "save") {
    setReviewError(null);
    setSavingReview(true);
    try {
      const res = await fetch(`/api/models/${encodeURIComponent(model.id)}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklist,
          note: reviewNote.trim() ? reviewNote.trim() : null,
          decision,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setReviewError(body?.error?.message ?? t.dash.failures.internal);
        return;
      }
      if (body?.model) {
        const updated: ModelDto = body.model;
        setModel(updated);
        setChecklist(updated.checklist);
        setReviewNote(updated.reviewNote ?? "");
      }
    } finally {
      setSavingReview(false);
    }
  }

  async function handleSaveMeta(e: React.FormEvent) {
    e.preventDefault();
    setSavingMeta(true);
    setMetaSaved(false);
    try {
      const w = widthMm.trim() ? Number(widthMm) : null;
      const h = heightMm.trim() ? Number(heightMm) : null;
      const d = depthMm.trim() ? Number(depthMm) : null;

      const res = await fetch(`/api/models/${encodeURIComponent(model.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          sku: sku.trim() ? sku.trim() : null,
          category,
          dimensions: { widthMm: w, heightMm: h, depthMm: d },
        }),
      });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.model) {
        setModel(body.model);
        setMetaSaved(true);
      }
    } finally {
      setSavingMeta(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/models/${encodeURIComponent(model.id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push(localePath(locale, "/dashboard/models"));
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href={localePath(locale, "/dashboard/models")}
            className="text-xs font-medium text-accent hover:underline"
          >
            ← {t.dash.detail.back}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl sm:text-3xl font-bold" data-testid="studio-title">
              {model.title}
            </h1>
            <span className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-accent">
              {t.dash.provenance[model.provenance]}
            </span>
            <span
              data-testid="studio-status-badge"
              className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs font-medium text-fg"
            >
              {t.dash.status[model.status]}
            </span>
            <span
              data-testid="studio-review-badge"
              className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs font-medium text-muted"
            >
              {t.dash.review[model.reviewState]}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasFile && (
            <a
              href={`/api/models/${encodeURIComponent(model.id)}/file?download=1`}
              data-testid="download-glb-btn"
              className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-bg hover:bg-accent-strong"
            >
              {t.dash.detail.download}
            </a>
          )}
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            data-testid="studio-delete-btn"
            className="rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-medium text-danger hover:border-danger"
          >
            {t.dash.detail.delete}
          </button>
        </div>
      </div>

      {/* Provenance disclaimer banner */}
      <div className="rounded-[14px] border border-line bg-surface-2 p-4 text-xs text-muted">
        {model.source === "demo" ? t.dash.detail.demoDisclaimer : t.dash.detail.aiDisclaimer}
      </div>

      {/* Processing Job Banner */}
      {model.status === "processing" && (
        <div
          data-testid="job-processing-panel"
          className="rounded-[14px] border border-amber/40 bg-amber/10 p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-sm font-semibold text-fg">
                {t.dash.detail.jobTitle}: {t.dash.jobState[model.jobState]}
              </h2>
              <p className="mt-1 text-xs text-muted">{t.dash.detail.jobProcessing}</p>
            </div>
            <button
              type="button"
              onClick={refreshStatus}
              disabled={refreshing}
              data-testid="refresh-job-btn"
              className="rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-medium text-fg hover:border-accent disabled:opacity-50"
            >
              {refreshing ? t.dash.detail.refreshing : t.dash.detail.refresh}
            </button>
          </div>
        </div>
      )}

      {/* Failed Job Panel */}
      {model.status === "failed" && (
        <div
          role="alert"
          data-testid="job-failed-panel"
          className="rounded-[14px] border border-danger/50 bg-danger/10 p-5 text-fg"
        >
          <h2 className="font-display text-sm font-semibold text-danger">{t.dash.detail.jobFailedTitle}</h2>
          <p className="mt-1 text-xs leading-relaxed">
            {model.failureCode && model.failureCode in t.dash.failures
              ? t.dash.failures[model.failureCode as keyof typeof t.dash.failures]
              : model.error || t.dash.failures.internal}
          </p>
          {model.error && (
            <p className="mt-2 font-mono text-xs text-muted">
              {t.dash.detail.providerDetail}: {model.error}
            </p>
          )}
          <p className="mt-2 text-xs font-medium">
            {t.dash.detail.attemptsLabel}: {model.attemptsDebited} / {model.attemptsRefunded}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left column: 3D Viewer + Source Photo */}
        <div className="space-y-6 lg:col-span-7">
          {hasFile ? (
            <ModelViewerBox
              src={`/api/models/${encodeURIComponent(model.id)}/file`}
              alt={model.title}
              provenanceBadge={t.dash.provenance[model.provenance]}
              hint={t.dash.detail.viewerHint}
              resetLabel={t.dash.detail.resetView}
              autoRotateLabel={t.dash.detail.autoRotate}
              autoRotateOffLabel={t.dash.detail.autoRotateOff}
              loadingLabel={t.dash.detail.viewerLoading}
              errorLabel={t.dash.detail.viewerError}
              testId="studio-viewer"
            />
          ) : (
            <div className="flex h-80 items-center justify-center rounded-[16px] border border-dashed border-line bg-surface p-6 text-sm text-muted">
              {t.dash.detail.notReady}
            </div>
          )}

          {model.source === "sloyd" && model.sourceViews.length > 0 && (
            <div className="rounded-[16px] border border-line bg-surface p-5">
              <h2 className="font-display text-sm font-semibold text-fg">
                {model.sourceViews.length > 1 ? t.dash.detail.sourcePhotosTitle : t.dash.detail.sourcePhoto}
              </h2>
              <p className="mt-1 text-xs text-muted">{t.dash.detail.sourcePhotoNote}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {model.sourceViews.map((view) => (
                  <figure key={view} className="space-y-1">
                    <div className="overflow-hidden rounded-xl border border-line bg-bg p-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/models/${encodeURIComponent(model.id)}/source?view=${view}`}
                        alt={`${model.title} — ${t.dash.create.views[view]}`}
                        data-testid={view === "front" ? "studio-source-photo" : `studio-source-photo-${view}`}
                        className="aspect-square w-full rounded object-contain"
                      />
                    </div>
                    {model.sourceViews.length > 1 && <figcaption className="text-xs text-muted">{t.dash.create.views[view]}</figcaption>}
                  </figure>
                ))}
              </div>
            </div>
          )}

          {model.inputKind === "text" && model.prompt && (
            <div className="rounded-[16px] border border-line bg-surface p-5">
              <h2 className="font-display text-sm font-semibold text-fg">{t.dash.detail.promptTitle}</h2>
              <p className="mt-1 text-xs text-muted">{t.dash.detail.promptNote}</p>
              <blockquote data-testid="studio-prompt" className="mt-3 rounded-xl border border-line bg-bg p-3 text-sm leading-relaxed text-fg">
                {model.prompt}
              </blockquote>
            </div>
          )}

          {/* Details Card */}
          <div className="rounded-[16px] border border-line bg-surface p-5">
            <h2 className="font-display text-sm font-semibold text-fg">{t.dash.detail.details}</h2>
            <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
              <div className="flex flex-col gap-0.5 rounded-lg bg-bg px-3 py-2">
                <dt className="text-muted">{t.dash.detail.statusLabel}</dt>
                <dd className="font-medium text-fg">
                  {model.status === "ready" && model.reviewState !== "pending" ? t.dash.review[model.reviewState] : t.dash.status[model.status]}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5 rounded-lg bg-bg px-3 py-2">
                <dt className="text-muted">{t.dash.detail.sourceLabel}</dt>
                <dd className="font-medium text-fg">{model.inputKind ? t.dash.inputKind[model.inputKind] : t.dash.source[model.source]}</dd>
              </div>
              <div className="flex flex-col gap-0.5 rounded-lg bg-bg px-3 py-2">
                <dt className="text-muted">{t.dash.detail.provenanceLabel}</dt>
                <dd className="font-medium text-fg">{t.dash.provenance[model.provenance]}</dd>
              </div>
              <div className="flex flex-col gap-0.5 rounded-lg bg-bg px-3 py-2">
                <dt className="text-muted">{t.dash.detail.createdLabel}</dt>
                <dd className="font-medium text-fg">{formatDate(model.createdAt, locale)}</dd>
              </div>
              {model.fileSize !== null && (
                <div className="flex flex-col gap-0.5 rounded-lg bg-bg px-3 py-2">
                  <dt className="text-muted">{t.dash.detail.sizeLabel}</dt>
                  <dd className="font-medium text-fg">{formatBytes(model.fileSize)}</dd>
                </div>
              )}
              {model.textureResolution && (
                <div className="flex flex-col gap-0.5 rounded-lg bg-bg px-3 py-2">
                  <dt className="text-muted">{t.dash.detail.textureLabel}</dt>
                  <dd className="font-medium text-fg">{model.textureResolution}</dd>
                </div>
              )}
              <div className="flex flex-col gap-0.5 rounded-lg bg-bg px-3 py-2">
                <dt className="text-muted">{t.dash.detail.attemptsLabel}</dt>
                <dd className="font-medium text-fg">
                  {model.attemptsDebited} / {model.attemptsRefunded}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5 rounded-lg bg-bg px-3 py-2">
                <dt className="text-muted">{t.dash.detail.creditsLabel}</dt>
                <dd className="font-medium text-fg">{model.providerCreditsEstimate}</dd>
              </div>
              {model.checksum && (
                <div className="flex flex-col gap-0.5 rounded-lg bg-bg px-3 py-2 sm:col-span-2">
                  <dt className="text-muted">{t.dash.detail.checksumLabel}</dt>
                  <dd className="truncate font-mono text-xs text-fg">
                    {model.checksum}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Right column: Review Checklist + Product Metadata */}
        <div className="space-y-6 lg:col-span-5">
          {hasFile && (
            <section
              aria-labelledby="review-heading"
              className="rounded-[16px] border border-line bg-surface p-5"
            >
              <h2 id="review-heading" className="font-display text-sm font-semibold text-fg">
                {t.dash.detail.reviewTitle}
              </h2>
              <p className="mt-1 text-xs text-muted">{t.dash.detail.reviewIntro}</p>

              {model.reviewState === "approved" && (
                <div
                  data-testid="review-approved-banner"
                  className="mt-3 rounded-xl border border-accent/40 bg-accent/10 p-3 text-xs text-accent"
                >
                  {t.dash.detail.approvedBanner}
                </div>
              )}
              {model.reviewState === "rejected" && (
                <div
                  data-testid="review-rejected-banner"
                  className="mt-3 rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs text-danger"
                >
                  {t.dash.detail.rejectedBanner}
                </div>
              )}

              <div className="mt-4 space-y-2.5">
                {CHECKLIST_KEYS.map((key) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line bg-bg p-2.5 text-xs text-fg hover:border-accent"
                  >
                    <input
                      type="checkbox"
                      checked={checklist[key]}
                      onChange={() => toggleChecklist(key)}
                      data-testid={`checklist-${key}`}
                      className="mt-0.5 h-4 w-4 rounded border-line accent-accent"
                    />
                    <span>{(model.inputKind === "text" ? t.dash.detail.checklistText : t.dash.detail.checklist)[key]}</span>
                  </label>
                ))}
              </div>

              <div className="mt-4">
                <label htmlFor="review-note" className="block text-xs font-medium text-muted">
                  {t.dash.detail.note}
                </label>
                <textarea
                  id="review-note"
                  rows={2}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder={t.dash.detail.notePlaceholder}
                  data-testid="review-note-input"
                  className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-xs text-fg"
                />
              </div>

              {!allChecked && (
                <p className="mt-2 text-xs text-muted">{t.dash.detail.approveDisabled}</p>
              )}

              {reviewError && (
                <p role="alert" className="mt-2 text-xs font-medium text-danger">
                  {reviewError}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!allChecked || savingReview}
                  onClick={() => submitReview("approve")}
                  data-testid="review-approve-btn"
                  className="rounded-xl bg-accent px-3.5 py-2 text-xs font-semibold text-bg hover:bg-accent-strong disabled:opacity-50"
                >
                  {t.dash.detail.approve}
                </button>
                <button
                  type="button"
                  disabled={savingReview}
                  onClick={() => submitReview("reject")}
                  data-testid="review-reject-btn"
                  className="rounded-xl border border-danger/50 bg-bg px-3.5 py-2 text-xs font-medium text-danger hover:border-danger disabled:opacity-50"
                >
                  {t.dash.detail.reject}
                </button>
                <button
                  type="button"
                  disabled={savingReview}
                  onClick={() => submitReview("save")}
                  data-testid="review-save-btn"
                  className="rounded-xl border border-line bg-bg px-3.5 py-2 text-xs font-medium text-fg hover:border-accent disabled:opacity-50"
                >
                  {t.dash.detail.saveProgress}
                </button>
                {model.reviewState !== "pending" && (
                  <button
                    type="button"
                    disabled={savingReview}
                    onClick={() => submitReview("reset")}
                    data-testid="review-reset-btn"
                    className="rounded-xl border border-line bg-bg px-3.5 py-2 text-xs font-medium text-fg hover:border-accent disabled:opacity-50"
                  >
                    {t.dash.detail.reset}
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Product Metadata & User Dimensions */}
          <section
            aria-labelledby="meta-heading"
            className="rounded-[16px] border border-line bg-surface p-5"
          >
            <h2 id="meta-heading" className="font-display text-sm font-semibold text-fg">
              {t.dash.detail.metaTitle}
            </h2>
            <p className="mt-1 text-xs text-muted">{t.dash.detail.metaIntro}</p>

            <form onSubmit={handleSaveMeta} className="mt-4 space-y-3">
              <div>
                <label htmlFor="meta-title" className="block text-xs font-medium text-muted">
                  {t.dash.detail.fields.title}
                </label>
                <input
                  id="meta-title"
                  type="text"
                  maxLength={75}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-1.5 text-xs text-fg"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="meta-sku" className="block text-xs font-medium text-muted">
                    {t.dash.detail.fields.sku}
                  </label>
                  <input
                    id="meta-sku"
                    type="text"
                    maxLength={64}
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-1.5 text-xs text-fg"
                  />
                </div>
                <div>
                  <label htmlFor="meta-cat" className="block text-xs font-medium text-muted">
                    {t.dash.detail.fields.category}
                  </label>
                  <select
                    id="meta-cat"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-1.5 text-xs text-fg"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {t.dash.categories[c]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="meta-w" className="block text-xs font-medium text-muted">
                    {t.dash.detail.fields.width}
                  </label>
                  <input
                    id="meta-w"
                    type="number"
                    min={1}
                    max={100000}
                    value={widthMm}
                    onChange={(e) => setWidthMm(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-line bg-bg px-2.5 py-1.5 text-xs text-fg"
                  />
                </div>
                <div>
                  <label htmlFor="meta-h" className="block text-xs font-medium text-muted">
                    {t.dash.detail.fields.height}
                  </label>
                  <input
                    id="meta-h"
                    type="number"
                    min={1}
                    max={100000}
                    value={heightMm}
                    onChange={(e) => setHeightMm(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-line bg-bg px-2.5 py-1.5 text-xs text-fg"
                  />
                </div>
                <div>
                  <label htmlFor="meta-d" className="block text-xs font-medium text-muted">
                    {t.dash.detail.fields.depth}
                  </label>
                  <input
                    id="meta-d"
                    type="number"
                    min={1}
                    max={100000}
                    value={depthMm}
                    onChange={(e) => setDepthMm(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-line bg-bg px-2.5 py-1.5 text-xs text-fg"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={savingMeta}
                  data-testid="save-meta-btn"
                  className="rounded-xl bg-accent px-3.5 py-2 text-xs font-semibold text-bg hover:bg-accent-strong disabled:opacity-50"
                >
                  {t.dash.detail.saveMeta}
                </button>
                {metaSaved && <span className="text-xs text-accent">✓</span>}
              </div>
            </form>
          </section>
        </div>
      </div>

      {confirmDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="studio-del-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-md rounded-[16px] border border-line bg-surface p-6 shadow-xl">
            <h2 id="studio-del-title" className="font-display text-base font-semibold text-fg">
              {t.dash.detail.deleteTitle}
            </h2>
            <p className="mt-2 text-sm text-muted">{t.dash.detail.deleteText}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
                className="rounded-xl border border-line bg-bg px-4 py-2 text-xs font-medium text-fg hover:border-accent"
              >
                {t.dash.create.back}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                data-testid="studio-confirm-delete-btn"
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
