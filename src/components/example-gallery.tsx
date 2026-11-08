"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Box, Grid3x3 } from "lucide-react";
import { ModelViewerBox } from "@/components/model-viewer-box";
import { TryExampleButton, useTryExample } from "@/components/try-example";
import { EXAMPLES, exampleGlb, examplePoster, FIRST_EXAMPLE, exampleById, type Example, type ExampleGroup } from "@/content/examples";
import type { StudioCopy } from "@/content/studio-copy";
import { localePath } from "@/i18n/config";
import type { Locale } from "@/lib/types";
import { cn, formatBytes } from "@/lib/utils";

export type GalleryModel = { id: string; title: string; status: string; provenance: string; poster: string | null };

const GROUPS: ("all" | ExampleGroup)[] = ["all", "stores", "games", "design"];
/** Hover must be deliberate: passing the pointer over the grid should not start loading models. */
const HOVER_DELAY_MS = 180;

const chip = (active: boolean) => cn("rounded-full px-3 py-1.5 text-sm font-medium transition-colors", active ? "bg-surface-2 text-fg" : "text-muted hover:text-fg");
const tabClass = (active: boolean) => cn("font-display text-xl font-semibold tracking-tight transition-colors sm:text-2xl", active ? "text-fg" : "text-muted hover:text-fg");

export function ExampleGallery({ locale, copy, models }: { locale: Locale; copy: StudioCopy["gallery"]; models: GalleryModel[] }) {
  const [tab, setTab] = useState<"examples" | "mine">(models.length > 0 ? "mine" : "examples");
  const [group, setGroup] = useState<"all" | ExampleGroup>("all");
  const [mesh, setMesh] = useState(false);
  const [selected, setSelected] = useState<Example | null>(null);
  // One live viewer at a time, on the card under the pointer. Everything else is a plain image.
  const [live, setLive] = useState<string | null>(null);
  const [liveReady, setLiveReady] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { tryExample, busy, error } = useTryExample(locale, copy.tryError);

  const list = group === "all" ? EXAMPLES : EXAMPLES.filter((e) => e.group === group);

  useEffect(() => {
    if (selected) dialogRef.current?.showModal();
  }, [selected]);
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  function hover(id: string | null) {
    if (timer.current) window.clearTimeout(timer.current);
    if (id === null) {
      setLive(null);
      setLiveReady(null);
      return;
    }
    timer.current = window.setTimeout(() => setLive(id), HOVER_DELAY_MS);
  }

  return (
    <section aria-label={copy.label} className="space-y-4" id="ejemplos">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label={copy.label} className="flex items-baseline gap-4">
          <button type="button" onClick={() => setTab("examples")} aria-pressed={tab === "examples"} data-testid="gallery-tab-examples" className={tabClass(tab === "examples")}>
            {copy.examples}
          </button>
          <button type="button" onClick={() => setTab("mine")} aria-pressed={tab === "mine"} data-testid="gallery-tab-mine" className={tabClass(tab === "mine")}>
            {copy.mine}
          </button>
        </div>
        {tab === "examples" ? (
          <div className="flex flex-wrap items-center gap-1">
            <div role="group" aria-label={copy.filterLabel} className="flex flex-wrap items-center gap-0.5">
              {GROUPS.map((g) => (
                <button key={g} type="button" onClick={() => setGroup(g)} aria-pressed={group === g} data-testid={`gallery-group-${g}`} className={chip(group === g)}>
                  {copy.groups[g]}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setMesh((v) => !v)} aria-pressed={mesh} data-testid="gallery-mesh" className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-medium text-muted hover:text-fg">
              <Grid3x3 className="h-3.5 w-3.5" aria-hidden="true" />
              {mesh ? copy.surface : copy.mesh}
            </button>
          </div>
        ) : (
          models.length > 0 && (
            <Link href={localePath(locale, "/dashboard/models")} className="text-sm font-medium text-accent hover:underline">
              {copy.viewAll} →
            </Link>
          )
        )}
      </div>

      {tab === "examples" ? (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((e, i) => {
              const isLive = live === e.id && !mesh;
              return (
                <li key={e.id} className={cn(i === 0 && group === "all" && "col-span-2 row-span-2")}>
                  <button
                    type="button"
                    onClick={() => setSelected(e)}
                    onPointerEnter={(ev) => ev.pointerType === "mouse" && hover(e.id)}
                    onPointerLeave={() => hover(null)}
                    data-testid={`example-card-${e.id}`}
                    className="card-lift group relative block aspect-square w-full overflow-hidden rounded-[24px] border border-line bg-surface text-left"
                  >
                    <Image
                      src={examplePoster(e.id, mesh)}
                      alt={e.title[locale]}
                      width={640}
                      height={640}
                      unoptimized
                      loading={i < 4 ? "eager" : "lazy"}
                      className={cn("absolute inset-0 h-full w-full object-contain p-4 transition-opacity duration-200", liveReady === e.id && isLive && "opacity-0")}
                    />
                    {isLive && (
                      <span className="pointer-events-none absolute inset-0 p-4">
                        <ModelViewerBox src={exampleGlb(e.id)} alt="" bare spin wheelZoom={false} heightClass="h-full" loadingLabel="" errorLabel="" testId={`example-live-${e.id}`} onReady={() => setLiveReady(e.id)} />
                      </span>
                    )}
                    <span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
                      <span className="min-w-0 rounded-2xl bg-bg/80 px-3 py-1.5">
                        <span className="block truncate text-sm font-medium">{e.title[locale]}</span>
                        <span className="block font-mono text-xs text-muted">
                          {e.triangles.toLocaleString("en-US")} tris · {formatBytes(e.bytes)}
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-muted">{copy.exampleNote}</p>
        </>
      ) : models.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[24px] border border-line bg-surface p-10 text-center">
          <h3 className="font-display text-lg font-semibold">{copy.mineEmptyTitle}</h3>
          <p className="max-w-md text-sm text-muted">{copy.mineEmptyText}</p>
          <TryExampleButton locale={locale} example={exampleById(FIRST_EXAMPLE)!} label={copy.tryIt} busyLabel={copy.trying} errorText={copy.tryError} />
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {models.map((m) => (
            <li key={m.id}>
              <Link href={localePath(locale, `/dashboard/models/${m.id}`)} data-testid={`overview-model-${m.id}`} className="card-lift group relative block aspect-square overflow-hidden rounded-[24px] border border-line bg-surface">
                {m.poster ? (
                  <Image src={m.poster} alt="" width={640} height={640} unoptimized loading="lazy" className="absolute inset-0 h-full w-full object-contain p-4" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-muted">
                    <Box className="h-12 w-12" aria-hidden="true" />
                  </span>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-bg/80 px-2.5 py-1 text-xs font-medium text-muted">{m.status}</span>
                <span className="absolute inset-x-3 bottom-3 rounded-2xl bg-bg/80 px-3 py-1.5">
                  <span className="block truncate text-sm font-medium">{m.title}</span>
                  <span className="block truncate text-xs text-muted">{m.provenance}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <dialog
          ref={dialogRef}
          onClose={() => setSelected(null)}
          onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
          aria-labelledby="example-dialog-title"
          data-testid="example-dialog"
          className="m-auto w-[min(960px,calc(100vw-2rem))] rounded-[24px] border border-line bg-surface p-0 text-fg backdrop:bg-black/70"
        >
          <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_300px]">
            <ModelViewerBox
              src={exampleGlb(selected.id)}
              alt={selected.title[locale]}
              provenanceBadge={copy.examples}
              heightClass="h-[320px] md:h-[520px]"
              resetLabel={copy.viewer.reset}
              autoRotateLabel={copy.viewer.spin}
              autoRotateOffLabel={copy.viewer.stop}
              loadingLabel={copy.viewer.loading}
              errorLabel={copy.viewer.error}
              wireframeLabel={copy.viewer.mesh}
              surfaceLabel={copy.viewer.surface}
              hint={copy.viewer.hint}
              testId="example-viewer"
            />
            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 id="example-dialog-title" className="font-display text-xl font-semibold">
                  {selected.title[locale]}
                </h2>
                <button type="button" onClick={() => dialogRef.current?.close()} className="rounded-full border border-line px-3 py-1 text-xs font-medium text-muted hover:text-fg">
                  {copy.close}
                </button>
              </div>
              <dl className="divide-y divide-line text-sm">
                <div className="flex justify-between gap-3 py-2">
                  <dt className="text-muted">{copy.triangles}</dt>
                  <dd className="font-mono">{selected.triangles.toLocaleString("en-US")}</dd>
                </div>
                <div className="flex justify-between gap-3 py-2">
                  <dt className="text-muted">{copy.weight}</dt>
                  <dd className="font-mono">{formatBytes(selected.bytes)}</dd>
                </div>
                <div className="flex justify-between gap-3 py-2">
                  <dt className="text-muted">{copy.texture}</dt>
                  <dd className="font-mono">{selected.textureSize} px</dd>
                </div>
              </dl>
              <p className="text-xs leading-relaxed text-muted">{copy.exampleNote}</p>
              <div className="mt-auto flex flex-col gap-1">
                <button type="button" onClick={() => tryExample(selected)} disabled={busy !== null} data-testid="example-try" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-bg disabled:opacity-70">
                  {busy ? copy.trying : copy.tryIt}
                </button>
                {error && (
                  <p role="alert" className="text-xs text-danger">
                    {error}
                  </p>
                )}
              </div>
            </div>
          </div>
        </dialog>
      )}
    </section>
  );
}
