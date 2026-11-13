"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Images, Type } from "lucide-react";
import { ArtImage } from "@/components/home/art-image";
import { ModelStage } from "@/components/model";
import { SpecLine } from "@/components/ui";
import type { ArtImage as Art } from "@/content/landing-art";
import type { HomeCopy } from "@/content/home-copy";

/**
 * One model told in six steps while the page scrolls. The stage stays in view (CSS sticky) and the layer on it follows the step
 * that is crossing the middle of the screen. The scroll itself is never taken over: nothing here listens to wheel or touch events.
 * Steps 0 to 5 are: input, mesh, clay, texture, web file, export.
 */
export function BuildSequence({
  layers,
  alt,
  copy,
  figures,
}: {
  layers: { wire: Art; clay: Art; beauty: Art };
  alt: string;
  copy: HomeCopy["sequence"];
  /** Measured on the sample file: original and web triangles, web GLB size. */
  figures: { original: string; web: string; size: string };
}) {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    items.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const layer = (on: boolean) => `absolute inset-0 h-full w-full object-contain transition-opacity duration-500 motion-reduce:transition-none ${on ? "opacity-100" : "opacity-0"}`;
  const inputIcons = [ImageIcon, Images, Type];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
      <div className="sticky top-20 z-10 h-fit self-start lg:top-28">
        <ModelStage className="h-[36dvh] min-h-[250px] sm:h-[44dvh] lg:h-[min(64dvh,560px)]">
          <div role="img" aria-label={copy.stageLabel} data-testid="build-stage" data-step={active} className="relative h-full w-full p-6 pb-10">
            <ArtImage image={layers.wire} alt="" sizes="(min-width: 1024px) 520px, 90vw" className={layer(active === 1)} />
            <ArtImage image={layers.clay} alt="" sizes="(min-width: 1024px) 520px, 90vw" className={layer(active === 2)} />
            <ArtImage image={layers.beauty} alt="" sizes="(min-width: 1024px) 520px, 90vw" className={layer(active >= 3)} />
            <span className="sr-only">{alt}</span>

            <div aria-hidden="true" className={`absolute inset-0 flex items-center justify-center gap-3 transition-opacity duration-500 motion-reduce:transition-none ${active === 0 ? "opacity-100" : "opacity-0"}`}>
              {inputIcons.map((Icon, i) => (
                <span key={copy.input[i]} className="flex w-24 flex-col items-center gap-2 rounded-2xl border border-line-strong bg-surface-1 px-3 py-5 text-[13px] text-muted">
                  <Icon className="h-7 w-7 text-accent" />
                  {copy.input[i]}
                </span>
              ))}
            </div>

            <div className={`absolute inset-x-4 bottom-3 flex justify-center transition-opacity duration-500 motion-reduce:transition-none ${active === 4 ? "opacity-100" : "opacity-0"}`} aria-hidden={active !== 4}>
              <SpecLine parts={[`${figures.original} → ${figures.web} ${copy.triangles}`, `${figures.size} ${copy.webFile}`]} className="rounded-full bg-surface-1/90 px-4 py-2 backdrop-blur" />
            </div>
            <div className={`absolute inset-x-4 bottom-3 flex justify-center gap-2 transition-opacity duration-500 motion-reduce:transition-none ${active === 5 ? "opacity-100" : "opacity-0"}`} aria-hidden={active !== 5}>
              {["GLB", "OBJ", "STL"].map((f) => (
                <span key={f} className="rounded-full border border-line-strong bg-surface-1/90 px-3.5 py-1.5 font-mono text-[13px] text-fg backdrop-blur">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </ModelStage>
        <p className="mt-3 text-center text-[13px] text-muted">{copy.sample}</p>
      </div>

      <ol className="space-y-6 lg:space-y-0">
        {copy.steps.map((s, i) => (
          <li
            key={s.title}
            data-step={i}
            ref={(el) => {
              items.current[i] = el;
            }}
            className="flex min-h-[24dvh] flex-col justify-center gap-3 py-3 lg:min-h-[20dvh]"
          >
            <span className={`font-mono text-[13px] tabular-nums transition-colors ${active === i ? "text-accent" : "text-subtle"}`}>0{i + 1}</span>
            <h3 className={`text-2xl font-semibold leading-tight transition-colors md:text-3xl ${active === i ? "text-fg" : "text-muted"}`}>{s.title}</h3>
            <p className="max-w-md text-base leading-relaxed text-muted">{s.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
