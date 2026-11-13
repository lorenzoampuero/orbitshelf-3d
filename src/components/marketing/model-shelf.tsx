"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ModelStage, SpinViewer } from "@/components/model";
import { Chip, Dialog, DialogContent, SpecLine } from "@/components/ui";
import type { HomeCopy } from "@/content/home-copy";
import type { GalleryModel, ModelCategory } from "@/lib/models";
import type { Locale } from "@/lib/types";

/**
 * The home's shelf: two rows of studio thumbnails that scroll sideways, filtered by type.
 * Thumbnails are small images; the 36-frame spin sheet loads only when a model is opened, so the page stays light.
 * The quick view has no live 3D on purpose: the hero already holds the page's one WebGL viewer.
 */
export function ModelShelf({
  models,
  featured,
  categories,
  locale,
  copy,
  createHref,
}: {
  models: GalleryModel[];
  /** Slugs shown under "All", in order. */
  featured: string[];
  categories: ModelCategory[];
  locale: Locale;
  copy: HomeCopy["shelf"];
  createHref: string;
}) {
  const [category, setCategory] = useState<ModelCategory | "all">("all");
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const shown = category === "all" ? featured.map((s) => models.find((m) => m.slug === s)).filter((m): m is GalleryModel => Boolean(m)) : models.filter((m) => m.category === category);
  const open = models.find((m) => m.slug === openSlug);

  return (
    <div className="space-y-6">
      <div role="group" aria-label={copy.label} className="flex flex-wrap justify-center gap-2">
        <Chip pressed={category === "all"} onClick={() => setCategory("all")} data-testid="shelf-chip-all">
          {copy.all}
        </Chip>
        {categories.map((c) => (
          <Chip key={c} pressed={category === c} onClick={() => setCategory(c)} data-testid={`shelf-chip-${c}`}>
            {copy.categories[c]}
          </Chip>
        ))}
      </div>

      <div className="relative">
        <ul
          data-testid="model-shelf"
          className="grid snap-x snap-mandatory auto-cols-[46vw] grid-flow-col grid-rows-2 gap-3 overflow-x-auto scroll-smooth pb-3 sm:auto-cols-[172px] lg:auto-cols-[172px] [scrollbar-width:thin]"
        >
          {shown.map((m) => (
            <li key={m.slug} className="snap-start">
              <button
                type="button"
                onClick={() => setOpenSlug(m.slug)}
                aria-label={`${copy.open} ${m.name[locale]}`}
                data-testid={`shelf-model-${m.slug}`}
                className="group/card relative block w-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-stage text-left transition-[border-color,transform] duration-[var(--t-control)] ease-[var(--ease-out)] hover:-translate-y-1 hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span className="relative block aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element -- pre-built WebP files with their own srcset */}
                  <img
                    src={m.beauty.thumb}
                    srcSet={`${m.beauty.thumb} 240w, ${m.beauty.srcSmall} 800w`}
                    sizes="(min-width: 640px) 172px, 46vw"
                    width={m.beauty.width}
                    height={m.beauty.height}
                    alt={m.alt[locale]}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-contain p-[6%] transition-transform duration-[var(--t-panel)] ease-[var(--ease-out)] group-hover/card:-translate-y-2 group-hover/card:scale-[1.03]"
                  />
                </span>
                <span className="block border-t border-line px-3 py-2 text-[13px] font-medium text-fg">{m.name[locale]}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Dialog open={Boolean(open)} onOpenChange={(next) => !next && setOpenSlug(null)}>
        {open ? (
          <DialogContent title={open.name[locale]} description={copy.quickHint} closeLabel={copy.close} className="max-w-3xl">
            <ModelStage className="p-4 pb-12 sm:p-6 sm:pb-14">
              <SpinViewer key={open.slug} model={open} locale={locale} className="mx-auto max-h-[52dvh]" />
            </ModelStage>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SpecLine parts={[`${Math.round(open.tris.web / 1000)}K tris`, "GLB", copy.categories[open.category]]} />
              <Link href={createHref} className="btn-pill btn-solid">
                {copy.create}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
