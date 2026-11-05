"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { localePath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import {
  CATEGORIES,
  DEMO_ASSETS,
  IMAGE_VIEWS,
  MAX_PROMPT_CHARS,
  TEXTURE_RESOLUTIONS,
  type Category,
  type DemoAsset,
  type EngineDto,
  type ImageView,
  type InputKind,
  type Locale,
  type QuoteDto,
  type TextureResolution,
} from "@/lib/types";
import { ModelViewerBox } from "@/components/model-viewer-box";

type Mode = "photos" | "text" | "demo";
type ApiFailure = {
  model?: { id: string };
  imageCode?: keyof Dictionary["dash"]["imageErrors"];
  fields?: Record<string, string>;
  error?: { code?: string; message?: string };
};

export function CreateWizard({
  locale,
  dict,
  engines,
  attemptsLeft,
}: {
  locale: Locale;
  dict: Dictionary;
  engines: EngineDto[];
  attemptsLeft: number;
}) {
  const providerReady = engines.length > 0;
  const router = useRouter();
  const c = dict.dash.create;

  const [mode, setMode] = useState<Mode>(providerReady ? "photos" : "demo");
  const [title, setTitle] = useState(providerReady ? "" : c.demoObjects.vase);
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState<Category>(providerReady ? "apparel" : "home-decor");
  const [demoAsset, setDemoAsset] = useState<DemoAsset>("vase");
  const [textureResolution, setTextureResolution] = useState<TextureResolution>("1k");
  const [files, setFiles] = useState<Partial<Record<ImageView, File>>>({});
  const [resets, setResets] = useState<Partial<Record<ImageView, number>>>({});
  const [prompt, setPrompt] = useState("");
  const [confirmPaid, setConfirmPaid] = useState(false);
  const [rightsAffirmed, setRightsAffirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedModelId, setFailedModelId] = useState<string | null>(null);

  const [chosenEngine, setChosenEngine] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteDto | null>(null);

  // Only engines that really support this mode are offered. A photo engine with fewer slots hides the views it cannot use.
  const compatible = engines.filter((e) => e.modes.includes(mode === "text" ? "text" : "image"));
  const engine = compatible.find((e) => e.id === chosenEngine) ?? compatible[0] ?? null;
  const visibleViews = IMAGE_VIEWS.filter((v) => !engine || engine.views.includes(v));
  const photoCount = visibleViews.filter((v) => files[v]).length;
  const kind: InputKind = mode === "text" ? "text" : photoCount >= 2 ? "multi-image" : "image";
  const textureOptions = TEXTURE_RESOLUTIONS.filter((tr) => tr !== "none" || engine?.geometryOnly);
  const texture = textureOptions.includes(textureResolution) ? textureResolution : "1k";
  const engineId = engine?.id ?? null;

  // The cost shown always comes from the server, for exactly these options.
  useEffect(() => {
    if (mode === "demo" || !engineId) return;
    const ctrl = new AbortController();
    fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({ engineId, mode: kind, photoCount: kind === "text" ? 0 : Math.max(photoCount, 1), texture }),
    })
      .then((r) => (r.ok ? (r.json() as Promise<{ quote: QuoteDto }>) : null))
      .then((d) => setQuote(d?.quote ?? null))
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [mode, engineId, kind, photoCount, texture]);

  // Object URLs for the photo thumbnails. They are revoked when the selection changes or the form unmounts.
  const previews = useMemo(() => {
    const out: Partial<Record<ImageView, string>> = {};
    for (const v of IMAGE_VIEWS) {
      const f = files[v];
      if (f) out[v] = URL.createObjectURL(f);
    }
    return out;
  }, [files]);
  useEffect(() => () => Object.values(previews).forEach((u) => URL.revokeObjectURL(u)), [previews]);

  function chooseMode(next: Mode) {
    setMode(next);
    setError(null);
    if (next === "demo" && !title.trim()) setTitle(c.demoObjects[demoAsset]);
  }

  function setView(view: ImageView, file: File | null) {
    setFiles((prev) => {
      const next = { ...prev };
      if (file) next[view] = file;
      else delete next[view];
      return next;
    });
  }

  function showFailure(data: ApiFailure) {
    if (data.imageCode && data.imageCode in dict.dash.imageErrors) {
      setError(dict.dash.imageErrors[data.imageCode]);
    } else if (data.fields?.prompt) {
      setError(c.errors.prompt);
    } else if (data.error?.code && data.error.code in dict.dash.failures) {
      setError(dict.dash.failures[data.error.code as keyof typeof dict.dash.failures]);
    } else {
      setError(data.error?.message || dict.common.somethingWrong);
    }
    if (data.model?.id) setFailedModelId(data.model.id);
  }

  async function send(init: RequestInit) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/models", { method: "POST", ...init });
      const data = (await res.json()) as ApiFailure;
      if (!res.ok || !data.model) {
        showFailure(data);
        return;
      }
      router.push(localePath(locale, `/dashboard/models/${data.model.id}`));
      router.refresh();
    } catch {
      setError(dict.common.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFailedModelId(null);

    const cleanTitle = title.trim();
    if (!cleanTitle || cleanTitle.length > 75) {
      setError(c.errors.name);
      return;
    }
    if (sku.trim().length > 64) {
      setError(c.errors.sku);
      return;
    }

    if (mode === "demo") {
      await send({
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "demo", title: cleanTitle, sku: sku.trim() || null, category, demoAsset }),
      });
      return;
    }

    if (mode === "photos" && !files.front) {
      setError(c.errors.photo);
      return;
    }
    if (mode === "text" && prompt.replace(/\s+/g, " ").trim().length < 10) {
      setError(c.errors.prompt);
      return;
    }
    if (!confirmPaid || !rightsAffirmed) {
      setError(c.errors.confirm);
      return;
    }

    if (mode === "text") {
      await send({
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "ai-text",
          engineId,
          title: cleanTitle,
          sku: sku.trim() || null,
          category,
          textureResolution: texture,
          prompt,
          confirmPaid: true,
          rightsAffirmed: true,
        }),
      });
      return;
    }

    const form = new FormData();
    form.set("source", "ai");
    if (engineId) form.set("engineId", engineId);
    form.set("title", cleanTitle);
    form.set("sku", sku.trim());
    form.set("category", category);
    form.set("textureResolution", texture);
    form.set("confirmPaid", "true");
    form.set("rightsAffirmed", "true");
    for (const v of visibleViews) {
      const f = files[v];
      if (f) form.set(`${v}Image`, f);
    }
    await send({ body: form });
  }

  const modeCard = (value: Mode, label: string, text: string, testId: string, disabled = false) => (
    <label
      className={`flex items-start gap-3 rounded-xl border bg-bg p-3.5 ${mode === value ? "border-accent" : "border-line"} ${
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <input
        type="radio"
        name="source"
        value={value}
        disabled={disabled}
        checked={mode === value}
        onChange={() => chooseMode(value)}
        data-testid={testId}
        className="mt-1"
      />
      <div className="space-y-1 text-xs">
        <div className="font-semibold text-fg">{label}</div>
        <p className="text-muted leading-relaxed">{text}</p>
      </div>
    </label>
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
      <form onSubmit={onSubmit} noValidate className="lg:col-span-7 rounded-[16px] border border-line bg-surface p-6 space-y-6">
        {/* 1. Product */}
        <fieldset className="space-y-4">
          <legend className="font-display text-lg font-semibold">{c.productTitle}</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="create-title" className="block text-xs font-medium text-fg mb-1.5">
                {c.name} *
              </label>
              <input
                id="create-title"
                name="title"
                type="text"
                required
                maxLength={75}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={c.namePlaceholder}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-sm text-fg"
              />
            </div>
            <div>
              <label htmlFor="create-sku" className="block text-xs font-medium text-fg mb-1.5">
                {c.sku} ({dict.common.optional})
              </label>
              <input
                id="create-sku"
                name="sku"
                type="text"
                maxLength={64}
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder={c.skuPlaceholder}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-sm text-fg"
              />
            </div>
          </div>

          <div>
            <label htmlFor="create-category" className="block text-xs font-medium text-fg mb-1.5">
              {c.category}
            </label>
            <select
              id="create-category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-sm text-fg"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {dict.dash.categories[cat]}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        <hr className="border-line" />

        {/* 2. Source */}
        <fieldset className="space-y-4">
          <legend className="font-display text-lg font-semibold">{c.sourceTitle}</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {modeCard("photos", c.sourceAi, providerReady ? c.sourceAiText : c.sourceAiUnavailable, "source-sloyd-radio", !providerReady)}
            {modeCard("text", c.sourceText, providerReady ? c.sourceTextText : c.sourceAiUnavailable, "source-text-radio", !providerReady)}
            {modeCard("demo", c.sourceDemo, c.sourceDemoText, "source-demo-radio")}
          </div>

          {mode === "demo" && (
            <div className="space-y-2">
              <label htmlFor="create-demo-asset" className="block text-xs font-medium text-fg">
                {c.demoObject}
              </label>
              <select
                id="create-demo-asset"
                name="demoAsset"
                value={demoAsset}
                onChange={(e) => setDemoAsset(e.target.value as DemoAsset)}
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-sm text-fg"
              >
                {DEMO_ASSETS.map((a) => (
                  <option key={a} value={a}>
                    {c.demoObjects[a]}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted">{c.demoNote}</p>
            </div>
          )}

          {mode === "photos" && (
            <div className="space-y-3">
              <p className="text-xs text-muted leading-relaxed">{c.photosGuide}</p>
              <div className="grid grid-cols-2 gap-3">
                {visibleViews.map((view) => (
                  <div key={view} className="space-y-1.5">
                    <label htmlFor={`create-photo-${view}`} className="block text-xs font-medium text-fg">
                      {c.views[view]} {view === "front" ? "*" : `(${c.viewsOptional})`}
                    </label>
                    {/* The key remounts the input when a photo is removed, which clears the browser's own file selection. */}
                    <input
                      key={`${view}-${resets[view] ?? 0}`}
                      id={`create-photo-${view}`}
                      name={`${view}Image`}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => setView(view, e.target.files?.[0] ?? null)}
                      data-testid={view === "front" ? "create-photo-input" : `create-photo-input-${view}`}
                      className="block w-full rounded-xl border border-line bg-bg px-2.5 py-2 text-xs text-fg file:mr-2 file:rounded-lg file:border-0 file:bg-accent file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-bg"
                    />
                    {previews[view] && (
                      <div className="flex items-center gap-2 rounded-xl border border-line bg-bg p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not optimizable */}
                        <img src={previews[view]} alt="" className="h-12 w-12 rounded-lg object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setView(view, null);
                            setResets((r) => ({ ...r, [view]: (r[view] ?? 0) + 1 }));
                          }}
                          className="text-xs font-semibold text-fg underline"
                        >
                          {c.photoRemove}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted">{c.photoHint}</p>
            </div>
          )}

          {mode === "text" && (
            <div className="space-y-1.5">
              <label htmlFor="create-prompt" className="block text-xs font-medium text-fg">
                {c.prompt} *
              </label>
              <textarea
                id="create-prompt"
                name="prompt"
                rows={5}
                maxLength={MAX_PROMPT_CHARS}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={c.promptPlaceholder}
                data-testid="create-prompt-input"
                className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-sm text-fg"
              />
              <div className="flex items-start justify-between gap-3 text-xs text-muted">
                <p>{c.promptHint}</p>
                <span className="shrink-0 tabular-nums">{c.promptCount.replace("{n}", String(prompt.length)).replace("{max}", String(MAX_PROMPT_CHARS))}</span>
              </div>
            </div>
          )}

          {mode !== "demo" && (
            <div className="space-y-4">
              {compatible.length > 1 && (
                <div>
                  <label htmlFor="create-engine" className="block text-xs font-medium text-fg mb-1.5">
                    {c.engine}
                  </label>
                  <select
                    id="create-engine"
                    name="engineId"
                    value={engineId ?? ""}
                    onChange={(e) => setChosenEngine(e.target.value)}
                    data-testid="create-engine-select"
                    className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-sm text-fg"
                  >
                    {compatible.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label htmlFor="create-texture" className="block text-xs font-medium text-fg mb-1.5">
                  {c.texture}
                </label>
                <select
                  id="create-texture"
                  name="textureResolution"
                  value={texture}
                  onChange={(e) => setTextureResolution(e.target.value as TextureResolution)}
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-sm text-fg"
                >
                  {textureOptions.map((tr) => (
                    <option key={tr} value={tr}>
                      {c.textures[tr]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-line bg-surface-2 p-4 space-y-2 text-xs">
                <div className="font-semibold text-fg">{c.costTitle}</div>
                <p className="text-muted leading-relaxed" data-testid="create-cost-text">
                  {quote && quote.engineId === engineId ? c.costText.replace("{engine}", quote.engineLabel).replace("{usd}", quote.usd.toFixed(2)) : c.costLoading}
                </p>
                <div className="font-medium text-accent">{c.attemptsLeft.replace("{n}", String(attemptsLeft))}</div>
              </div>

              <div className="space-y-2.5 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmPaid}
                    onChange={(e) => setConfirmPaid(e.target.checked)}
                    data-testid="confirm-paid-checkbox"
                    className="mt-0.5"
                  />
                  <span>{c.confirmPaid}</span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rightsAffirmed}
                    onChange={(e) => setRightsAffirmed(e.target.checked)}
                    data-testid="confirm-rights-checkbox"
                    className="mt-0.5"
                  />
                  <span>{c.rights}</span>
                </label>
              </div>
            </div>
          )}
        </fieldset>

        {error && (
          <div role="alert" data-testid="create-error-alert" className="rounded-xl border border-danger/50 bg-danger/10 p-3.5 text-xs text-danger space-y-2">
            <div>{error}</div>
            {failedModelId && (
              <Link href={localePath(locale, `/dashboard/models/${failedModelId}`)} className="inline-block font-semibold underline">
                {c.viewJob} →
              </Link>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          data-testid="create-submit-btn"
          className="w-full rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-bg disabled:opacity-50"
        >
          {submitting ? c.submitting : mode === "demo" ? c.submitDemo : c.submitAi}
        </button>
      </form>

      <div className="lg:col-span-5 space-y-3">
        <ModelViewerBox
          src={`/demo/${demoAsset}.glb`}
          alt={c.demoObjects[demoAsset]}
          hint={dict.dash.detail.viewerHint}
          provenanceBadge={dict.dash.provenance["demo-sample"]}
          resetLabel={dict.dash.detail.resetView}
          autoRotateLabel={dict.dash.detail.autoRotate}
          autoRotateOffLabel={dict.dash.detail.autoRotateOff}
          loadingLabel={dict.dash.detail.viewerLoading}
          errorLabel={dict.dash.detail.viewerError}
          heightClass="h-[380px]"
          testId="create-preview-viewer"
        />
        <p className="text-xs text-muted px-1">{c.previewCaption}</p>
      </div>
    </div>
  );
}
