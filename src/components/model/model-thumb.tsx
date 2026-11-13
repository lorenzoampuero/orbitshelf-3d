import type { GalleryModel } from "@/lib/models";
import type { Locale } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * A studio thumbnail: the render on the stage colour, always the same square, so a wall of different models looks like one set.
 * A plain <img> with its own srcset (the WebP files are already sized). On hover the model rises a little and the card lifts.
 */
export function ModelThumb({
  model,
  locale,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  priority = false,
  caption = false,
  className,
}: {
  model: GalleryModel;
  locale: Locale;
  sizes?: string;
  priority?: boolean;
  /** Shows the model's name under the picture. */
  caption?: boolean;
  className?: string;
}) {
  const { beauty } = model;
  return (
    <figure
      className={cn(
        "group/thumb relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-stage transition-[border-color,transform] duration-[var(--t-control)] ease-[var(--ease-out)] hover:-translate-y-1 hover:border-line-strong",
        className,
      )}
      data-testid="model-thumb"
      data-model={model.slug}
    >
      <div className="relative aspect-square">
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-built WebP files with their own srcset */}
        <img
          src={beauty.srcSmall}
          srcSet={`${beauty.thumb} 240w, ${beauty.srcSmall} 800w, ${beauty.src} 1600w`}
          sizes={sizes}
          width={beauty.width}
          height={beauty.height}
          alt={model.alt[locale]}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain p-[6%] transition-transform duration-[var(--t-panel)] ease-[var(--ease-out)] group-hover/thumb:-translate-y-2 group-hover/thumb:scale-[1.02]"
        />
      </div>
      {caption ? <figcaption className="border-t border-line px-3.5 py-2.5 text-[13px] font-medium text-fg">{model.name[locale]}</figcaption> : null}
    </figure>
  );
}
