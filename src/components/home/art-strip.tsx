import { art, artCopy, type HeroArtId } from "@/content/landing-art";
import type { Locale } from "@/lib/types";
import { ArtImage } from "./art-image";

/** Three renders in a row, for the top of an inner page. */
export function ArtStrip({ locale, order = ["hoodie", "dragon", "kitchen"], view = "beauty" }: { locale: Locale; order?: HeroArtId[]; view?: "beauty" | "alt" }) {
  const copy = artCopy[locale];
  return (
    <figure className="mx-auto max-w-4xl" data-testid="art-figure">
      <div className="grid grid-cols-3 items-end gap-3 sm:gap-8">
        {order.map((id) => (
          <ArtImage key={id} image={art[id][view]} alt={copy.alts[id]} sizes="(min-width: 768px) 280px, 30vw" className="art-float h-auto w-full" />
        ))}
      </div>
    </figure>
  );
}
