"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ModelViewerBox } from "@/components/model-viewer-box";
import { exampleGlb, STAGE_EXAMPLE } from "@/content/examples";
import { studioCopy } from "@/content/studio-copy";
import { localePath } from "@/i18n/config";
import { setComposerHandoff, titleFromFile } from "@/lib/composer-handoff";
import { resolvePreset } from "@/lib/profiles";
import { IMAGE_VIEWS, MAX_PROMPT_CHARS, type EngineDto, type GenerationPreset, type ImageView, type InputKind, type Locale, type QuoteDto } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "photo" | "multi" | "text" | "import";
const TABS: Tab[] = ["photo", "multi", "text", "import"];
const IMAGE_TYPES = "image/png,image/jpeg,image/webp";

/** The first thing on the home page. It collects the input and hands it to the create wizard, which stays the only place that submits a job. */
export function StudioComposer({ locale, engines, preset }: { locale: Locale; engines: EngineDto[]; preset: GenerationPreset }) {
  // Read here, not passed in: this copy holds functions, which cannot cross from a server component.
  const copy = studioCopy[locale];
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("photo");
  const [photos, setPhotos] = useState<File[]>([]);
  const [glb, setGlb] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [dragging, setDragging] = useState(false);
  const [quote, setQuote] = useState<QuoteDto | null>(null);

  const hasEngine = engines.length > 0;
  const needsEngine = tab !== "import" && !hasEngine;
  const kind: InputKind = tab === "text" ? "text" : tab === "multi" && photos.length >= 2 ? "multi-image" : "image";
  const photoCount = kind === "text" ? 0 : Math.max(photos.length, 1);
  const pick = tab === "import" ? null : resolvePreset(preset, engines, kind, photoCount);
  const engineId = pick?.engineId ?? (tab === "import" ? null : (engines.find((e) => e.modes.includes(kind))?.id ?? null));
  const texture = pick?.texture ?? "1k";

  // The price comes from the server, as it does in the wizard.
  useEffect(() => {
    if (!engineId) return;
    const ctrl = new AbortController();
    fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({ engineId, mode: kind, photoCount, texture }),
    })
      .then((r) => (r.ok ? (r.json() as Promise<{ quote: QuoteDto }>) : null))
      .then((d) => setQuote(d?.quote ?? null))
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [engineId, kind, photoCount, texture]);

  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  function take(files: File[]) {
    if (tab === "import") {
      const file = files.find((f) => f.name.toLowerCase().endsWith(".glb"));
      if (file) setGlb(file);
      return;
    }
    if (needsEngine || tab === "text") return;
    const images = files.filter((f) => IMAGE_TYPES.split(",").includes(f.type));
    if (images.length > 0) setPhotos(images.slice(0, tab === "photo" ? 1 : IMAGE_VIEWS.length));
  }

  function choose(next: Tab) {
    setTab(next);
    if (next === "photo") setPhotos((p) => p.slice(0, 1));
  }

  function submit() {
    if (needsEngine) return router.push(localePath(locale, "/dashboard/create"));
    if (tab === "import") {
      setComposerHandoff({ glb: glb ?? undefined, title: glb ? titleFromFile(glb.name) : undefined });
      return router.push(localePath(locale, "/dashboard/create?mode=import"));
    }
    if (tab === "text") {
      setComposerHandoff({ prompt, title: prompt.trim().slice(0, 60) || undefined });
      return router.push(localePath(locale, "/dashboard/create?mode=text"));
    }
    const files: Partial<Record<ImageView, File>> = {};
    photos.forEach((f, i) => {
      files[IMAGE_VIEWS[i]] = f;
    });
    setComposerHandoff({ files, title: photos[0] ? titleFromFile(photos[0].name) : undefined });
    router.push(localePath(locale, "/dashboard/create?mode=photos"));
  }

  const caption = tab === "import" ? copy.dropGlb : tab === "multi" ? copy.dropPhotos : copy.dropPhoto;
  const engineLabel = needsEngine ? copy.engineDemo : tab === "import" ? null : quote?.engineLabel ? `${copy.engineAuto}: ${quote.engineLabel}` : null;
  const costLabel = needsEngine || tab === "import" ? copy.free : quote ? copy.cost(quote.charge, quote.unit) : null;
  const showStage = tab !== "text";
  const accept = tab === "import" ? ".glb,model/gltf-binary" : IMAGE_TYPES;

  return (
    <section aria-labelledby="studio-title" className="relative -mx-4 -mt-4 overflow-hidden px-4 pb-12 pt-8 md:-mx-8 md:-mt-8 md:px-8 md:pt-12">
      <div aria-hidden="true" className="studio-floor" />
      <div className="relative mx-auto flex max-w-[600px] flex-col items-center gap-5 text-center">
        <div>
          <h1 id="studio-title" className="hero-title text-5xl sm:text-6xl">
            {copy.title}
          </h1>
          <p className="mt-3 text-sm text-muted sm:text-base">{copy.subtitle}</p>
        </div>

        <div role="group" aria-label={copy.promptLabel} className="flex max-w-full flex-wrap justify-center gap-0.5 rounded-[24px] bg-surface p-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => choose(t)}
              aria-pressed={tab === t}
              data-testid={`composer-tab-${t}`}
              className={cn("rounded-full px-4 py-1.5 text-sm font-medium transition-colors", tab === t ? "bg-surface-2 text-fg" : "text-muted hover:text-fg")}
            >
              {copy.tabs[t]}
            </button>
          ))}
        </div>

        <div className="w-full rounded-[28px] border border-line bg-surface p-3 text-left">
          {showStage ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                take([...e.dataTransfer.files]);
              }}
              data-testid="composer-stage"
              className={cn("relative h-[280px] overflow-hidden rounded-[20px] border border-dashed bg-bg sm:h-[320px]", dragging ? "border-accent" : "border-accent/35")}
            >
              {photos.length > 0 && tab !== "import" ? (
                <div className={cn("grid h-full gap-1 p-1", photos.length > 1 && "grid-cols-2")}>
                  {previews.map((src, i) => (
                    // Local object URLs: the image optimizer cannot read them.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={src} alt={`${copy.tabs.photo} ${i + 1}`} className="h-full min-h-0 w-full rounded-2xl object-contain" />
                  ))}
                </div>
              ) : tab === "import" && glb ? (
                <div className="flex h-full items-center justify-center px-6 text-center font-mono text-sm">{glb.name}</div>
              ) : (
                <>
                  <ModelViewerBox src={exampleGlb(STAGE_EXAMPLE)} alt="" bare spin wheelZoom={false} heightClass="h-full" loadingLabel="" errorLabel="" testId="composer-viewer" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-muted">{copy.exampleBadge}</span>
                </>
              )}
              {!needsEngine && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 p-3 text-center">
                <span className="rounded-2xl bg-bg/85 px-3 py-1.5 text-xs leading-relaxed text-muted">
                  {photos.length > 0 && tab !== "import" ? copy.photosChosen(photos.length) : caption}
                </span>
              </div>
              )}
              {!needsEngine && (
                <div className="absolute right-3 top-3 flex gap-1.5">
                  {(photos.length > 0 || glb) && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhotos([]);
                        setGlb(null);
                      }}
                      className="rounded-full bg-bg/85 px-3 py-1 text-xs font-medium text-fg"
                    >
                      {copy.clear}
                    </button>
                  )}
                  <label className="cursor-pointer rounded-full bg-accent px-3 py-1 text-xs font-semibold text-bg focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
                    {copy.chooseFile}
                    <input
                      key={tab}
                      type="file"
                      accept={accept}
                      multiple={tab === "multi"}
                      data-testid="composer-file"
                      className="sr-only"
                      onChange={(e) => {
                        take([...(e.target.files ?? [])]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 rounded-[20px] bg-bg p-3">
              <label htmlFor="composer-prompt" className="text-xs font-medium text-muted">
                {copy.promptLabel}
              </label>
              <textarea
                id="composer-prompt"
                value={prompt}
                maxLength={MAX_PROMPT_CHARS}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={copy.promptPlaceholder}
                disabled={needsEngine}
                rows={6}
                className="block w-full resize-none bg-transparent text-base text-fg outline-none placeholder:text-muted disabled:opacity-60"
              />
              {needsEngine && <p className="text-xs text-muted">{copy.needsEngine}</p>}
            </div>
          )}

          {showStage && needsEngine && <p className="mt-3 px-1 text-xs leading-relaxed text-muted">{copy.needsEngine}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {engineLabel && <span className="rounded-full border border-line px-3 py-1.5 text-xs text-muted">{engineLabel}</span>}
            {costLabel && (
              <span data-testid="composer-cost" className="rounded-full border border-line px-3 py-1.5 text-xs text-muted">
                {costLabel}
              </span>
            )}
            <button type="button" onClick={submit} data-testid="overview-create-cta" className="ml-auto rounded-full bg-accent px-7 py-2.5 text-sm font-semibold text-bg transition-transform active:scale-[0.98]">
              {needsEngine ? copy.createSample : copy.create}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
