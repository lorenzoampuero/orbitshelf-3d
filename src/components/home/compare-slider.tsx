"use client";

import { useState } from "react";
import { ChevronsLeftRight } from "lucide-react";
import type { FullArt } from "@/content/landing-art";
import { ArtImage } from "./art-image";

type Copy = { label: string; textured: string; clay: string; wire: string; viewLabel: string };

/**
 * The same render as texture and as clay or mesh, split by a handle. A native range input does the work,
 * so keyboard and screen readers get it for free; it sits invisibly over the picture and the handle follows it.
 */
export function CompareSlider({ model, alt, copy }: { model: FullArt; alt: string; copy: Copy }) {
  const [value, setValue] = useState(52);
  const [view, setView] = useState<"wire" | "clay">("wire");

  return (
    <div className="space-y-3" data-testid="compare-slider">
      <div className="relative w-full" style={{ aspectRatio: `${model.beauty.width} / ${model.beauty.height}` }}>
        <ArtImage image={model.beauty} alt={alt} sizes="(min-width: 768px) 520px, 100vw" className="absolute inset-0 h-full w-full object-contain" />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${value}%)` }} data-testid="compare-layer">
          <ArtImage image={model[view]} alt="" sizes="(min-width: 768px) 520px, 100vw" className="h-full w-full object-contain" />
        </div>
        <span className="absolute left-2 top-2 rounded-full border border-line bg-bg/80 px-2.5 py-1 text-xs font-medium">{copy.textured}</span>
        <span className="absolute right-2 top-2 rounded-full border border-line bg-bg/80 px-2.5 py-1 text-xs font-medium">{copy[view]}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          aria-label={copy.label}
          aria-valuetext={`${value}%`}
          data-testid="compare-range"
          className="peer absolute inset-0 h-full w-full cursor-ew-resize opacity-0 [touch-action:pan-y]"
        />
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white/80 peer-focus-visible:bg-accent" style={{ left: `${value}%` }} />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-fg text-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
          style={{ left: `${value}%` }}
        >
          <ChevronsLeftRight className="h-5 w-5" />
        </span>
      </div>
      <div role="group" aria-label={copy.viewLabel} className="flex justify-center gap-2">
        {(["wire", "clay"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            aria-pressed={view === v}
            data-testid={`compare-view-${v}`}
            className={`min-h-9 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
              view === v ? "border-transparent bg-accent-fill text-white" : "border-white/25 text-fg hover:border-accent"
            }`}
          >
            {copy[v]}
          </button>
        ))}
      </div>
    </div>
  );
}
