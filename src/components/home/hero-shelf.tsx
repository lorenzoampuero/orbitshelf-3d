"use client";

import { useState } from "react";
import { Armchair, Flower2, Lamp, type LucideIcon } from "lucide-react";
import { ModelViewerBox } from "@/components/model-viewer-box";

/**
 * The hero model with a small shelf under it: chips switch between the three demo GLBs.
 * Every model here is a demo sample, and the caption under the viewer says so.
 */
export type ShelfItem = {
  id: string;
  src: string;
  alt: string;
  label: string;
  /** Icon key for the chip. */
  icon: "vase" | "lamp" | "chair";
  /** The honest line under the viewer for this model (a demo sample, or how a real result was made). */
  caption: string;
};

const ICONS: Record<ShelfItem["icon"], LucideIcon> = { vase: Flower2, lamp: Lamp, chair: Armchair };

type ViewerLabels = {
  resetLabel: string;
  autoRotateLabel: string;
  autoRotateOffLabel: string;
  loadingLabel: string;
  errorLabel: string;
};

export function HeroShelf({
  items,
  shelfLabel,
  ghostWord,
  viewerLabels,
}: {
  items: ShelfItem[];
  shelfLabel: string;
  ghostWord: string;
  viewerLabels: ViewerLabels;
}) {
  const [activeId, setActiveId] = useState(items[0]?.id);
  const active = items.find((i) => i.id === activeId) ?? items[0];
  if (!active) return null;

  return (
    <div className="relative w-full">
      {/* The giant outlined word sits behind the model. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[44%] -translate-y-1/2 select-none text-center text-[clamp(10rem,24vw,19rem)] font-bold leading-none text-transparent"
        style={{ WebkitTextStroke: "1.5px rgb(167 139 250 / 0.38)" }}
      >
        {ghostWord}
      </div>

      <div className="float-slow relative z-10">
        <ModelViewerBox
          bare
          src={active.src}
          alt={active.alt}
          heightClass="h-[320px] sm:h-[400px] lg:h-[440px]"
          testId="hero-model-viewer"
          wheelZoom={false}
          {...viewerLabels}
        />
      </div>

      <p aria-live="polite" className="relative z-10 mt-1 text-center text-xs text-muted">{active.caption}</p>

      {/* The shelf: a board with the three models standing on it. */}
      <div role="group" aria-label={shelfLabel} className="relative z-10 mx-auto mt-4 max-w-sm space-y-0">
        <p className="mb-2 text-center text-xs font-medium text-muted">{shelfLabel}</p>
        <ul className="flex flex-wrap items-center justify-center gap-2 pb-3">
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            const on = item.id === active.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(item.id)}
                  aria-pressed={on}
                  data-testid={`hero-shelf-${item.id}`}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    on ? "border-transparent bg-blood text-white" : "border-white/25 text-fg hover:border-accent hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
        <div aria-hidden="true" className="h-[3px] rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>
    </div>
  );
}
