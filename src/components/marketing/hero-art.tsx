import { ArtImage } from "@/components/home/art-image";
import type { ArtImage as Art } from "@/content/landing-art";

/**
 * The hero's picture: one studio render that builds itself (mesh, clay, texture) over a violet glow, with two more renders
 * spilling out of small cards at its edges. Only images: no live 3D on the home.
 */
export function HeroArt({
  layers,
  alt,
  floats,
}: {
  layers: { wire: Art; clay: Art; beauty: Art };
  alt: string;
  floats: { image: Art; alt: string }[];
}) {
  return (
    <div className="relative mx-auto w-full max-w-[540px] lg:max-w-none">
      <div aria-hidden="true" className="hero-pool" />
      <div role="img" aria-label={alt} data-testid="hero-build" className="float-slow relative mx-auto aspect-square w-[88%] max-w-[500px] lg:w-full">
        <ArtImage image={layers.wire} alt="" sizes="(min-width: 1024px) 560px, 90vw" className="build-layer build-wire absolute inset-0 h-full w-full object-contain" />
        <ArtImage image={layers.clay} alt="" sizes="(min-width: 1024px) 560px, 90vw" className="build-layer build-clay absolute inset-0 h-full w-full object-contain" />
        <ArtImage image={layers.beauty} alt="" priority sizes="(min-width: 1024px) 560px, 90vw" className="build-layer build-beauty absolute inset-0 h-full w-full object-contain" />
      </div>
      {floats.map((f, i) => (
        <div
          key={f.alt}
          className={`absolute z-10 hidden w-24 rounded-2xl border border-line-strong bg-surface-1/90 p-2 shadow-[0_24px_50px_-24px_rgb(0_0_0/0.9)] backdrop-blur sm:block lg:w-32 ${
            i === 0 ? "bottom-6 left-0 -rotate-6 lg:-left-6" : "right-0 top-6 rotate-6 lg:-right-4"
          }`}
        >
          <ArtImage image={f.image} alt={f.alt} small sizes="128px" className="h-auto w-full" />
        </div>
      ))}
    </div>
  );
}
