import { ArtImage } from "@/components/home/art-image";
import { galleryModels, trisLine, type GalleryModel } from "@/lib/models";
import { CATEGORY_TONE } from "@/content/tones";
import type { Locale } from "@/lib/types";

/**
 * Renders for the inner pages. Every piece here is an image (no live 3D): the page keeps its one live viewer, if it has one.
 * Decorative renders carry an empty alt; the ones that stand alone carry the model's own alt text.
 */

/** One render inside a diagram: decorative, so no alt. */
export function ModelRender({ model, className = "h-20 w-20 sm:h-24 sm:w-24" }: { model: GalleryModel; className?: string }) {
  return <ArtImage image={model.beauty} alt="" small sizes="120px" className={`art-float shrink-0 object-contain ${className}`} />;
}

/**
 * The picture area of a card: one large render on the left, two small ones on the right.
 * `group-hover/tile` moves the small ones when the card carries that group.
 */
export function ModelTrio({ models, locale, sizes = "(min-width: 1024px) 200px, 300px" }: { models: [GalleryModel, GalleryModel, GalleryModel]; locale: Locale; sizes?: string }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-stage" data-tone={CATEGORY_TONE[models[0].category]}>
      <div aria-hidden="true" className="tone-pool" />
      <ArtImage image={models[0].beauty} alt={models[0].alt[locale]} sizes={sizes} className="art-float float-b absolute left-[2%] top-[8%] h-[84%] w-[62%] object-contain" />
      {models.slice(1).map((m, i) => (
        <ArtImage
          key={m.slug}
          image={m.beauty}
          alt={m.alt[locale]}
          small
          sizes="120px"
          className={`absolute right-[2%] h-[40%] w-[36%] object-contain transition-transform duration-[var(--t-panel)] ease-[var(--ease-out)] ${i === 0 ? "top-[8%] rotate-3 group-hover/tile:-translate-y-1" : "bottom-[6%] -rotate-3 group-hover/tile:translate-y-1"}`}
        />
      ))}
    </div>
  );
}

/** Two more models to float at the far sides of a pile, chosen from the gallery by the main model's slug so a page never changes between builds. */
function extrasFor(models: readonly GalleryModel[]): [GalleryModel, GalleryModel] {
  let h = 0;
  for (const ch of models[0].slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const pool = galleryModels.filter((m) => !models.some((x) => x.slug === m.slug));
  return [pool[h % pool.length], pool[(h * 7 + 3) % pool.length]];
}

const d = (s: number) => ({ "--d": `${s}s` }) as React.CSSProperties;

/**
 * The picture under an inner page's title: one large render in the middle on an orbit, two leaning in beside it and two small ones
 * far out, each floating on its own beat. The chips carry the main model's real figures. The middle one gets `priority`,
 * since it is the page's largest image.
 */
export function ModelPile({ models, locale }: { models: [GalleryModel, GalleryModel, GalleryModel]; locale: Locale }) {
  const [main, left, right] = models;
  const [farL, farR] = extrasFor(models);
  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-5xl sm:aspect-[16/8]" data-testid="model-pile">
      <div aria-hidden="true" className="hero-pool" />
      <div aria-hidden="true" className="orbit-wrap">
        <div className="orbit-ring r2">
          <span className="orbit-spin">
            <i className="orbit-dot" />
          </span>
        </div>
        <div className="orbit-ring r1">
          <span className="orbit-spin">
            <i className="orbit-dot" />
          </span>
        </div>
      </div>

      <div className="pop-in absolute bottom-[26%] left-[-1%] hidden w-[17%] sm:block" style={d(0.5)}>
        <div className="float-c">
          <ArtImage image={farL.beauty} alt="" small sizes="180px" className="art-float h-auto w-full -rotate-6 opacity-90" />
        </div>
      </div>
      <div className="pop-in absolute bottom-[30%] right-[-1%] hidden w-[17%] sm:block" style={d(0.6)}>
        <div className="float-a">
          <ArtImage image={farR.beauty} alt="" small sizes="180px" className="art-float h-auto w-full rotate-6 opacity-90" />
        </div>
      </div>

      <div className="pop-in absolute bottom-[4%] left-[6%] w-[31%] sm:left-[13%] sm:w-[27%]" style={d(0.3)}>
        <div className="float-b">
          <ArtImage image={left.beauty} alt={left.alt[locale]} sizes="(min-width: 768px) 270px, 31vw" className="art-float h-auto w-full -rotate-3" />
        </div>
      </div>
      <div className="pop-in absolute bottom-[4%] right-[6%] w-[31%] sm:right-[13%] sm:w-[27%]" style={d(0.4)}>
        <div className="float-c">
          <ArtImage image={right.beauty} alt={right.alt[locale]} sizes="(min-width: 768px) 270px, 31vw" className="art-float h-auto w-full rotate-3" />
        </div>
      </div>
      <div className="pop-in absolute bottom-[2%] left-1/2 w-[44%] -translate-x-1/2 sm:w-[39%]" style={d(0.15)}>
        <div className="float-a">
          <ArtImage image={main.beauty} alt={main.alt[locale]} priority sizes="(min-width: 768px) 440px, 46vw" className="art-float h-auto w-full" />
        </div>
      </div>

      <span className="data-chip float-b left-[5%] top-[10%] hidden sm:inline-flex">{trisLine(main)}</span>
      <span className="data-chip float-c right-[5%] top-[18%] hidden sm:inline-flex">GLB · OBJ · STL</span>
      <span className="data-chip float-a bottom-[8%] left-1/2 hidden -translate-x-[150%] lg:inline-flex">{(main.bytes.web / 1e6).toFixed(1)} MB</span>
    </div>
  );
}

/** A deterministic shuffle: the same seed gives the same order, so a page is the same in every build. */
function seeded(list: readonly GalleryModel[], seed: number): GalleryModel[] {
  const out = [...list];
  let x = (seed + 1) * 2654435761;
  for (let i = out.length - 1; i > 0; i--) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0;
    const j = x % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Two rows of renders drifting in opposite directions, each on a tile in the colour of its kind of model.
 * Pure decoration, so the whole band is hidden from assistive tech; `seed` gives every page its own order.
 */
export function RenderMarquee({ seed = 0 }: { seed?: number }) {
  const all = seeded(galleryModels, seed);
  const half = Math.ceil(all.length / 2);
  const rows = [all.slice(0, half), all.slice(half)];
  return (
    <div aria-hidden="true" className="overflow-hidden pb-2 pt-10 md:pt-12" data-testid="render-marquee">
      <div className="space-y-3.5">
        {rows.map((row, r) => (
          <div key={r} className="rm-band overflow-hidden">
            <div className={`rm-track ${r === 1 ? "rev" : ""}`}>
              {[0, 1].map((copy) => (
                <div key={copy} className="flex shrink-0">
                  {row.map((m) => (
                    <div key={`${copy}-${m.slug}`} className="rm-tile" data-tone={CATEGORY_TONE[m.category]}>
                      <ArtImage image={m.beauty} alt="" small sizes="170px" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A row of studio renders with the model name and its figures in mono, each over the colour of its kind of model. */
export function ModelRail({ models, locale, label }: { models: readonly GalleryModel[]; locale: Locale; label?: string }) {
  return (
    <ul aria-label={label} className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4" data-testid="model-rail">
      {models.map((m) => (
        <li key={m.slug} data-tone={CATEGORY_TONE[m.category]} className="card card-lift rail-tile reveal min-w-0 overflow-hidden">
          <div className="relative aspect-square bg-stage p-3">
            <div aria-hidden="true" className="tone-pool" />
            <ArtImage image={m.beauty} alt={m.alt[locale]} small sizes="(min-width: 768px) 260px, 46vw" className="relative h-full w-full object-contain" />
          </div>
          <div className="space-y-1 border-t border-line px-4 py-3">
            <p className="text-sm font-semibold leading-snug text-fg">{m.name[locale]}</p>
            <p className="font-mono text-xs text-muted">{trisLine(m)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** The cover of an article: one render centred on the studio floor under a coloured glow. */
export function ModelCover({ model, locale }: { model: GalleryModel; locale: Locale }) {
  return (
    <figure className="card reveal relative flex aspect-[16/8] items-center justify-center overflow-hidden bg-stage" data-testid="article-cover" data-tone={CATEGORY_TONE[model.category]}>
      <div aria-hidden="true" className="tone-pool" />
      <ArtImage image={model.beauty} alt={model.alt[locale]} sizes="(min-width: 768px) 700px, 92vw" className="art-float float-b relative h-[88%] w-auto max-w-full object-contain" />
    </figure>
  );
}

const SPOTLIGHT_COPY: Record<Locale, { original: string; web: string; file: string; kind: string }> = {
  en: { original: "Original mesh", web: "Web-ready", file: "Web file", kind: "Model spotlight" },
  es: { original: "Malla original", web: "Lista para web", file: "Archivo web", kind: "Modelo destacado" },
};
const shortTris = (n: number) => (n >= 9.5e5 ? `${(n / 1e6).toFixed(1)}M` : `${Math.round(n / 1e3)}K`);

/**
 * One model shown big: its render on an orbit over a coloured pool, and the figures measured from its files
 * (triangles before and after, size of the web file). Nothing here is invented: every number comes from the manifest.
 */
export function ModelSpotlight({ model, locale, flip = false }: { model: GalleryModel; locale: Locale; flip?: boolean }) {
  const t = SPOTLIGHT_COPY[locale];
  const stats = [
    { value: shortTris(model.tris.original), label: t.original },
    { value: shortTris(model.tris.web), label: t.web },
    { value: `${(model.bytes.web / 1e6).toFixed(1)} MB`, label: t.file },
  ];
  return (
    <div
      data-testid="model-spotlight"
      className="card reveal relative isolate grid grid-cols-1 items-center gap-6 overflow-hidden !border-[color-mix(in_srgb,var(--ta)_45%,transparent)] p-7 md:grid-cols-2 md:gap-10 md:p-10"
    >
      <div aria-hidden="true" className="tone-pool -z-10 opacity-80" />
      <div className={`space-y-6 ${flip ? "md:order-2" : ""}`}>
        <span className="tag-pill w-fit !pr-4">{t.kind}</span>
        <h3 className="font-display text-3xl font-semibold leading-tight md:text-4xl">{model.name[locale]}</h3>
        <dl className="grid grid-cols-3 gap-3">
          {stats.map((st) => (
            <div key={st.label} className="rounded-2xl border border-line bg-surface-2/70 p-3.5 md:p-4">
              <dt className="text-xs text-muted">{st.label}</dt>
              <dd className="mt-1 font-mono text-xl font-medium text-fg md:text-2xl">{st.value}</dd>
            </div>
          ))}
        </dl>
        <p className="flex flex-wrap gap-2">
          {["GLB", "OBJ", "STL"].map((f) => (
            <span key={f} className="rounded-full border border-line-strong bg-surface-1 px-3 py-1 font-mono text-[13px] text-fg">
              {f}
            </span>
          ))}
        </p>
      </div>
      <div className={`relative mx-auto aspect-square w-full max-w-[26rem] ${flip ? "md:order-1" : ""}`}>
        <div aria-hidden="true" className="orbit-wrap">
          <div className="orbit-ring r2">
            <span className="orbit-spin">
              <i className="orbit-dot" />
            </span>
          </div>
          <div className="orbit-ring r1">
            <span className="orbit-spin">
              <i className="orbit-dot" />
            </span>
          </div>
        </div>
        <div className="float-a absolute inset-[6%]">
          <ArtImage image={model.beauty} alt={model.alt[locale]} sizes="(min-width: 768px) 420px, 90vw" className="art-float h-full w-full object-contain" />
        </div>
      </div>
    </div>
  );
}
