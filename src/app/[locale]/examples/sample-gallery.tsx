"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { ModelViewerBox } from "@/components/model-viewer-box";

type Sample = { id: string; name: string; text: string; alt: string; size: string | null };

type Props = {
  samples: Sample[];
  groupLabel: string;
  badge: string;
  sizeLabel: string;
  downloadLabel: string;
  viewerLabels: {
    resetLabel: string;
    autoRotateLabel: string;
    autoRotateOffLabel: string;
    loadingLabel: string;
    errorLabel: string;
  };
};

/**
 * The demo samples that ship with the app. Only one viewer is mounted at a time (one WebGL context, one download),
 * and the others are picked from the list. Always labelled as demo, never as a result.
 */
export function SampleGallery({ samples, groupLabel, badge, sizeLabel, downloadLabel, viewerLabels }: Props) {
  const [activeId, setActiveId] = useState(samples[0]?.id);
  const active = samples.find((s) => s.id === activeId) ?? samples[0];
  if (!active) return null;

  return (
    <article className="card reveal grid grid-cols-1 gap-6 p-5 md:col-span-6 md:grid-cols-12 md:p-6">
      <div className="md:col-span-8">
        <ModelViewerBox
          key={active.id}
          src={`/demo/${active.id}.glb`}
          alt={active.alt}
          provenanceBadge={badge}
          heightClass="h-[320px] md:h-[440px]"
          wheelZoom={false}
          testId={`example-viewer-${active.id}`}
          {...viewerLabels}
        />
      </div>

      <div className="flex flex-col justify-between gap-6 md:col-span-4 md:py-2">
        <div role="group" aria-label={groupLabel} className="grid grid-cols-1 gap-2">
          {samples.map((s) => {
            const on = s.id === active.id;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={on}
                onClick={() => setActiveId(s.id)}
                className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                  on ? "border-accent bg-accent/10 text-fg" : "border-line bg-surface-2 text-muted hover:text-fg"
                }`}
              >
                <span>{s.name}</span>
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${on ? "bg-accent" : "bg-white/20"}`}
                />
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold leading-tight">{active.name}</h2>
          <p className="text-sm leading-relaxed text-muted">{active.text}</p>
          {active.size ? (
            <p className="text-xs text-muted">
              {sizeLabel}: {active.size}
            </p>
          ) : null}
          <a href={`/demo/${active.id}.glb`} download={`${active.id}-demo.glb`} className="btn-pill btn-outline">
            <Download className="h-4 w-4" aria-hidden="true" />
            {downloadLabel}
          </a>
        </div>
      </div>
    </article>
  );
}
