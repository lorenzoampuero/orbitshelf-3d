"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { localePath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import {
  CATEGORIES,
  DEMO_ASSETS,
  PROVIDER_CREDITS_GEOMETRY_ONLY,
  PROVIDER_CREDITS_PER_ATTEMPT,
  PROVIDER_CREDITS_PER_USD,
  TEXTURE_RESOLUTIONS,
  type Category,
  type DemoAsset,
  type Locale,
  type ModelSource,
  type TextureResolution,
} from "@/lib/types";
import { ModelViewerBox } from "@/components/model-viewer-box";

export function CreateWizard({
  locale,
  dict,
  providerReady,
  attemptsLeft,
}: {
  locale: Locale;
  dict: Dictionary;
  providerReady: boolean;
  attemptsLeft: number;
}) {
  const router = useRouter();
  const c = dict.dash.create;

  const [title, setTitle] = useState("Ceramic vase");
  const [sku, setSku] = useState("VASE-001");
  const [category, setCategory] = useState<Category>("home-decor");
  const [source, setSource] = useState<ModelSource>("demo");
  const [demoAsset, setDemoAsset] = useState<DemoAsset>("vase");
  const [textureResolution, setTextureResolution] = useState<TextureResolution>("1k");
  const [file, setFile] = useState<File | null>(null);
  const [confirmPaid, setConfirmPaid] = useState(false);
  const [rightsAffirmed, setRightsAffirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedModelId, setFailedModelId] = useState<string | null>(null);

  const credits =
    textureResolution === "none" ? PROVIDER_CREDITS_GEOMETRY_ONLY : PROVIDER_CREDITS_PER_ATTEMPT;
  const usd = (credits / PROVIDER_CREDITS_PER_USD).toFixed(2);

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

    if (source === "demo") {
      setSubmitting(true);
      try {
        const res = await fetch("/api/models", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "demo",
            title: cleanTitle,
            sku: sku.trim() || null,
            category,
            demoAsset,
          }),
        });
        const data = (await res.json()) as {
          model?: { id: string };
          error?: { code?: string; message?: string };
        };
        if (!res.ok || !data.model) {
          setError(data.error?.message || dict.common.somethingWrong);
          return;
        }
        router.push(localePath(locale, `/dashboard/models/${data.model.id}`));
        router.refresh();
      } catch {
        setError(dict.common.networkError);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Sloyd AI job
    if (!file) {
      setError(c.errors.photo);
      return;
    }
    if (!confirmPaid || !rightsAffirmed) {
      setError(c.errors.confirm);
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("source", "sloyd");
      form.set("title", cleanTitle);
      form.set("sku", sku.trim());
      form.set("category", category);
      form.set("textureResolution", textureResolution);
      form.set("confirmPaid", "true");
      form.set("rightsAffirmed", "true");
      form.set("file", file);

      const res = await fetch("/api/models", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as {
        model?: { id: string };
        imageCode?: keyof Dictionary["dash"]["imageErrors"];
        error?: { code?: string; message?: string };
      };

      if (!res.ok) {
        if (data.imageCode && data.imageCode in dict.dash.imageErrors) {
          setError(dict.dash.imageErrors[data.imageCode]);
        } else if (data.error?.code && data.error.code in dict.dash.failures) {
          setError(
            dict.dash.failures[data.error.code as keyof typeof dict.dash.failures],
          );
        } else {
          setError(data.error?.message || dict.common.somethingWrong);
        }
        if (data.model?.id) {
          setFailedModelId(data.model.id);
        }
        return;
      }

      if (data.model?.id) {
        router.push(localePath(locale, `/dashboard/models/${data.model.id}`));
        router.refresh();
      }
    } catch {
      setError(dict.common.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
      <form
        onSubmit={onSubmit}
        noValidate
        className="lg:col-span-7 rounded-[16px] border border-line bg-surface p-6 space-y-6"
      >
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex items-start gap-3 rounded-xl border border-line bg-bg p-3.5 cursor-pointer">
              <input
                type="radio"
                name="source"
                value="demo"
                checked={source === "demo"}
                onChange={() => setSource("demo")}
                data-testid="source-demo-radio"
                className="mt-1"
              />
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-fg">{c.sourceDemo}</div>
                <p className="text-muted leading-relaxed">{c.sourceDemoText}</p>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 rounded-xl border border-line bg-bg p-3.5 ${
                providerReady ? "cursor-pointer" : "opacity-60 cursor-not-allowed"
              }`}
            >
              <input
                type="radio"
                name="source"
                value="sloyd"
                disabled={!providerReady}
                checked={source === "sloyd"}
                onChange={() => setSource("sloyd")}
                data-testid="source-sloyd-radio"
                className="mt-1"
              />
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-fg">{c.sourceAi}</div>
                <p className="text-muted leading-relaxed">
                  {providerReady ? c.sourceAiText : c.sourceAiUnavailable}
                </p>
              </div>
            </label>
          </div>

          {source === "demo" ? (
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
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="create-photo" className="block text-xs font-medium text-fg mb-1.5">
                  {c.photo} *
                </label>
                <input
                  id="create-photo"
                  name="file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  data-testid="create-photo-input"
                  className="block w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-xs text-fg file:mr-3 file:rounded-lg file:border-0 file:bg-mint file:px-3 file:py-1 file:text-xs file:font-semibold file:text-bg"
                />
                <p className="mt-1 text-xs text-muted">{c.photoHint}</p>
              </div>

              <div>
                <label htmlFor="create-texture" className="block text-xs font-medium text-fg mb-1.5">
                  {c.texture}
                </label>
                <select
                  id="create-texture"
                  name="textureResolution"
                  value={textureResolution}
                  onChange={(e) => setTextureResolution(e.target.value as TextureResolution)}
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-sm text-fg"
                >
                  {TEXTURE_RESOLUTIONS.map((tr) => (
                    <option key={tr} value={tr}>
                      {c.textures[tr]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-line bg-surface-2 p-4 space-y-2 text-xs">
                <div className="font-semibold text-fg">{c.costTitle}</div>
                <p className="text-muted leading-relaxed">
                  {c.costText.replace("{credits}", String(credits)).replace("{usd}", usd)}
                </p>
                <div className="font-medium text-mint">
                  {c.attemptsLeft.replace("{n}", String(attemptsLeft))}
                </div>
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
          <div
            role="alert"
            data-testid="create-error-alert"
            className="rounded-xl border border-danger/50 bg-danger/10 p-3.5 text-xs text-danger space-y-2"
          >
            <div>{error}</div>
            {failedModelId && (
              <Link
                href={localePath(locale, `/dashboard/models/${failedModelId}`)}
                className="inline-block font-semibold underline"
              >
                {c.viewJob} →
              </Link>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          data-testid="create-submit-btn"
          className="w-full rounded-xl bg-mint px-5 py-3 text-sm font-semibold text-bg disabled:opacity-50"
        >
          {submitting ? c.submitting : source === "demo" ? c.submitDemo : c.submitAi}
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
