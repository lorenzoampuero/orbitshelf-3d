import { ArrowRight, Image as ImageIcon, Images, Type } from "lucide-react";
import { ArtImage } from "@/components/home/art-image";
import { SpecLine } from "@/components/ui";
import type { ArtImage as Art } from "@/content/landing-art";
import type { HomeCopy } from "@/content/home-copy";

/**
 * "How it works" as three cards, each with a picture made of renders: the way in, the mesh and clay behind the finished model,
 * and the web file with its formats. No live 3D, no scroll takeover.
 */
export function HowCards({
  copy,
  layers,
  alt,
  start,
  web,
  views,
  figures,
}: {
  copy: HomeCopy["sequence"];
  layers: { wire: Art; clay: Art; beauty: Art };
  alt: string;
  start: Art;
  /** The model shown in the third card, whose figures are the ones in `figures`. */
  web: { image: Art; alt: string };
  /** Labels under the three layers: texture, clay, mesh. */
  views: { textured: string; clay: string; wire: string };
  figures: { original: string; web: string; size: string };
}) {
  const steps = [copy.steps[0], copy.steps[1], copy.steps[4]];
  const inputIcons = [ImageIcon, Images, Type];
  const box = "relative mt-auto aspect-[4/3] overflow-hidden rounded-2xl bg-stage";

  return (
    <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {steps.map((s, i) => (
        <li key={s.title} className="card flex min-w-0 flex-col gap-4 p-6">
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-3 font-mono text-sm text-fg">
              {i + 1}
            </span>
            <h3 className="pt-1 text-xl font-semibold leading-snug">{s.title}</h3>
          </div>
          <p className="text-sm leading-relaxed text-muted">{s.text}</p>

          {i === 0 && (
            <div className={`${box} flex items-center justify-center gap-3 px-4`} aria-hidden="true">
              <div className="flex flex-col gap-2">
                {inputIcons.map((Icon, k) => (
                  <span key={copy.input[k]} className="flex items-center gap-2 rounded-xl border border-line-strong bg-surface-1 px-3 py-2 text-[13px] text-muted">
                    <Icon className="h-4 w-4 text-accent" />
                    {copy.input[k]}
                  </span>
                ))}
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-accent" />
              <ArtImage image={start} alt="" small sizes="200px" className="art-float h-auto w-[44%] object-contain" />
            </div>
          )}

          {i === 1 && (
            <div className={box}>
              {[
                { img: layers.wire, pos: "left-[2%] top-[8%] w-[52%]" },
                { img: layers.clay, pos: "left-[24%] top-[2%] w-[52%]" },
                { img: layers.beauty, pos: "left-[46%] top-[12%] w-[52%]" },
              ].map((v, k) => (
                <ArtImage key={k} image={v.img} alt={k === 2 ? alt : ""} small sizes="200px" className={`absolute h-auto object-contain ${v.pos}`} />
              ))}
              <p className="absolute inset-x-0 bottom-2 flex justify-center gap-4 text-[12px] text-muted">
                <span>{views.wire}</span>
                <span>{views.clay}</span>
                <span>{views.textured}</span>
              </p>
            </div>
          )}

          {i === 2 && (
            <div className={`${box} flex flex-col items-center justify-between gap-2 px-4 pb-4 pt-3`}>
              <ArtImage image={web.image} alt={web.alt} small sizes="200px" className="art-float h-[62%] w-auto object-contain" />
              <div className="flex flex-wrap items-center justify-center gap-2">
                {["GLB", "OBJ", "STL"].map((f) => (
                  <span key={f} className="rounded-full border border-line-strong bg-surface-1 px-3 py-1 font-mono text-[13px] text-fg">
                    {f}
                  </span>
                ))}
              </div>
              <SpecLine parts={[`${figures.original} → ${figures.web} ${copy.triangles}`, `${figures.size} ${copy.webFile}`]} />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
