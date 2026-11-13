import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, GitCompare, Image as ImageIcon, Type } from "lucide-react";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { MarketingShell } from "@/components/marketing-shell";
import { ModelViewerBox } from "@/components/model-viewer-box";
import { ArtFigure, ArtImage } from "@/components/home/art-image";
import { CompareSlider } from "@/components/home/compare-slider";
import { Marquee } from "@/components/home/marquee";
import { TypedPrompt } from "@/components/home/typed-prompt";
import {
  Card,
  CardBody,
  Checklist,
  ClosingBanner,
  FaqList,
  Pill,
  Section,
  SectionTitle,
  Tile,
} from "@/components/marketing-kit";
import { AudienceTiles, type AudienceTile } from "@/components/marketing/audience-tiles";
import { HeroArt } from "@/components/marketing/hero-art";
import { HowCards } from "@/components/marketing/how-cards";
import { ConnectionsBand } from "@/components/marketing/connections-band";
import { HeroComposer } from "@/components/marketing/hero-composer";
import { showcase, showcaseBeforeAfter } from "@/config/showcase";
import { art, artCopy, MARQUEE_ITEMS } from "@/content/landing-art";
import { homeCopy } from "@/content/home-copy";
import { getModel, type GalleryModel } from "@/lib/models";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return buildPageMetadata({
    locale,
    path: "/",
    title: dict.meta.home.title,
    description: dict.meta.home.description,
  });
}

/** A plain text link with an arrow, for the end of a card. */
function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2 self-start text-sm font-semibold text-fg transition-colors hover:text-accent">
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}

/** Looks a gallery model up by slug and fails loudly in the build if the manifest and this page disagree. */
function model(slug: string): GalleryModel {
  const found = getModel(slug);
  if (!found) throw new Error(`Home page: model "${slug}" is not in the manifest`);
  return found;
}
const bigNumber = (n: number) => (n >= 9.5e5 ? `${(n / 1e6).toFixed(1)}M` : `${Math.round(n / 1e3)}K`);

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();
  const h = dict.home;
  const a = artCopy[locale];
  const c = homeCopy[locale];

  const beforeAfter = showcaseBeforeAfter();
  const posters = showcase.filter((s) => !s.hero);
  const create = localePath(locale, "/dashboard/create");
  const views = dict.dash.create.views;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: h.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const viewerLabels = {
    resetLabel: dict.dash.detail.resetView,
    autoRotateLabel: dict.dash.detail.autoRotate,
    autoRotateOffLabel: dict.dash.detail.autoRotateOff,
    loadingLabel: dict.dash.detail.viewerLoading,
    errorLabel: dict.dash.detail.viewerError,
  };

  // One model per job: nothing in this page shows the same piece twice, apart from the hero's build-up pair.
  const photoModel = model("blue-puffer-jacket");
  const textModel = model("lizard-creature");
  const multiModel = model("fabric-loveseat");
  const startModel = model("orange-puffer-vest");
  const webModel = model("t-rex");
  const voxel = model("blocky-voxel-character");
  const heroMech = model("orange-assault-mech");
  const golem = model("crystal-golem");

  const tileModels = {
    stores: ["zip-hoodie", "tufted-sofa", "money-bag"],
    games: ["blocky-voxel-character", "stone-cottage", "purple-dragon"],
    film: ["white-battle-mech", "orange-walker-mech", "red-dragon"],
    design: ["geometry-only-gadget", "sci-fi-device-230-parts", "robot-dog"],
  } as const;
  const tileHref = { stores: "/solutions/stores", games: "/solutions/games", film: "/solutions/design", design: "/solutions/design" } as const;
  const tiles: AudienceTile[] = c.uses.items.map((u) => ({
    key: u.key,
    tag: u.tag,
    title: u.title,
    text: u.text,
    cta: u.cta,
    href: localePath(locale, tileHref[u.key]),
    models: tileModels[u.key].map(model) as AudienceTile["models"],
  }));

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* 1. Hero: the title and a real composer on the left, the model on its stage on the right (stacked on small screens). */}
      <section className="relative overflow-hidden pb-6 pt-28 md:pt-36 lg:pt-32">
        <div className="container-page relative grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-6">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <Pill>{h.pill}</Pill>
            <h1 className="hero-title mt-6 max-w-3xl text-[clamp(2.4rem,4.6vw,4rem)]">{h.heroTitle}</h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">{h.heroText}</p>
            <div className="mt-8 w-full max-w-xl text-left">
              <HeroComposer locale={locale} copy={c.composer} examples={[a.prompt]} signedIn={Boolean(user)} />
            </div>
            <Link href={localePath(locale, "/examples")} data-testid="hero-cta-secondary" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-fg">
              {h.ctaSecondary}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <HeroArt
            layers={{ wire: art.dragon.wire, clay: art.dragon.clay, beauty: art.dragon.beauty }}
            alt={a.alts.dragon}
            floats={[
              { image: voxel.beauty, alt: voxel.alt[locale] },
              { image: heroMech.beauty, alt: heroMech.alt[locale] },
            ]}
          />
        </div>
      </section>

      <Marquee title={a.marqueeTitle} items={MARQUEE_ITEMS} />

      {/* 3. Three ways in: image, text and several images. The renders break out of their cards. */}
      <Section>
        <SectionTitle sub={h.waysSub}>{h.waysTitle}</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <Card lift className="relative flex flex-col gap-6 md:col-span-4">
            <div className="flex h-full flex-col justify-between gap-8 lg:max-w-[46%]">
              <CardBody tag={h.ways.image.tag} title={h.ways.image.title} text={h.ways.image.text} />
              <div className="space-y-6">
                <div aria-hidden="true" className="flex items-center gap-3">
                  <Tile>
                    <ImageIcon className="h-6 w-6" />
                  </Tile>
                  <ArrowRight className="h-5 w-5 shrink-0 text-accent" />
                  <span className="flex h-14 items-center rounded-2xl bg-accent-fill px-4 text-sm font-semibold text-white">GLB</span>
                </div>
                <TextLink href={localePath(locale, "/features/image-to-3d")}>{h.ways.image.cta}</TextLink>
              </div>
            </div>
            <ArtFigure image={photoModel.beauty} alt={photoModel.alt[locale]} sizes="(min-width: 1024px) 340px, 90vw" className="mx-auto w-full max-w-sm lg:absolute lg:-right-6 lg:top-1/2 lg:w-[58%] lg:max-w-none lg:-translate-y-1/2" />
          </Card>

          <Card lift className="flex flex-col justify-between gap-6 md:col-span-2">
            <CardBody tag={h.ways.text.tag} title={h.ways.text.title} text={h.ways.text.text} />
            <div className="space-y-5">
              <div className="space-y-1.5 rounded-xl border border-line px-4 py-3">
                <span className="flex items-center gap-2 text-xs text-muted">
                  <Type className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  {h.ways.text.promptLabel}
                </span>
                <TypedPrompt text={c.textPrompt} />
              </div>
              <ArtFigure image={textModel.beauty} alt={textModel.alt[locale]} sizes="(min-width: 768px) 240px, 80vw" className="mx-auto w-4/5" />
              <TextLink href={localePath(locale, "/features/text-to-3d")}>{h.ways.text.cta}</TextLink>
            </div>
          </Card>

          <Card lift tone="outline" className="grid grid-cols-1 gap-8 md:col-span-6 md:grid-cols-2 md:items-center">
            <div className="flex flex-col items-start gap-6">
              <CardBody tag={h.ways.multi.tag} title={h.ways.multi.title} text={h.ways.multi.text} />
              <TextLink href={localePath(locale, "/features/multi-image-to-3d")}>{h.ways.multi.cta}</TextLink>
            </div>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
              <div aria-hidden="true" className="shrink-0 space-y-2">
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-2">
                  {[0, 1, 2, 3].map((i) => (
                    <Tile key={i}>
                      <ImageIcon className="h-6 w-6" />
                    </Tile>
                  ))}
                </div>
                <p className="max-w-32 text-xs text-muted">{[views.front, views.left, views.back, views.right].join(", ")}</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 rotate-90 text-accent sm:rotate-0" aria-hidden="true" />
              <ArtFigure image={multiModel.beauty} alt={multiModel.alt[locale]} sizes="(min-width: 768px) 320px, 80vw" className="w-full min-w-0 max-w-xs md:-mt-10" />
            </div>
          </Card>

          {/* Only when a real, approved result exists. */}
          {beforeAfter && (
            <Card className="grid grid-cols-1 gap-6 md:col-span-6 md:grid-cols-12">
              <ul className="grid grid-cols-2 gap-3 md:col-span-5">
                {beforeAfter.photos.map((p) => (
                  <li key={p.view} className="space-y-1.5">
                    <Image
                      src={p.src}
                      width={p.width}
                      height={p.height}
                      alt={`${beforeAfter.title[locale]} · ${views[p.view]}`}
                      className="h-auto w-full rounded-xl border border-line"
                      sizes="(min-width: 1024px) 20vw, 45vw"
                    />
                    <span className="block text-xs text-muted">{views[p.view]}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-3 md:col-span-7">
                <ModelViewerBox
                  src={beforeAfter.glb}
                  alt={beforeAfter.alt[locale]}
                  heightClass="h-[340px]"
                  testId="home-before-after-viewer"
                  wheelZoom={false}
                  {...viewerLabels}
                />
                <p className="text-xs text-muted">{h.generatedPhotos.replace("{n}", String(beforeAfter.photos.length))}</p>
              </div>
            </Card>
          )}

        </div>
      </Section>

      {/* 4. How it works: three cards, each with a picture made of renders. */}
      <Section>
        <SectionTitle sub={`${c.sequence.sub} ${h.stepsNote}`}>{c.sequence.title}</SectionTitle>
        <HowCards
          copy={c.sequence}
          layers={{ wire: art.kitchen.wire, clay: art.kitchen.clay, beauty: art.kitchen.beauty }}
          alt={a.alts.kitchen}
          start={startModel.beauty}
          web={{ image: webModel.beauty, alt: webModel.alt[locale] }}
          views={{ textured: a.compare.textured, clay: a.compare.clay, wire: a.compare.wire }}
          figures={{ original: bigNumber(webModel.tris.original), web: bigNumber(webModel.tris.web), size: `${(webModel.bytes.web / (1024 * 1024)).toFixed(1)} MB` }}
        />
      </Section>

      {/* 5. Control: the one highlighted card of the page, the same model as texture, clay and mesh. */}
      <Section>
        <SectionTitle sub={h.controlSub}>{h.controlTitle}</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6 lg:grid-cols-4">
          <Card tone="feature" className="grid grid-cols-1 items-center gap-6 md:col-span-6 md:grid-cols-2 md:gap-10 md:p-7 lg:col-span-4">
            <div className="md:order-2">
              <CardBody tag={h.control.mesh.tag} title={h.control.mesh.title} text={h.control.mesh.text}>
                <p className="text-sm leading-relaxed text-muted">{h.twinText}</p>
              </CardBody>
            </div>
            <div className="mx-auto w-full max-w-sm md:order-1">
              <CompareSlider model={art.hoodie} alt={a.alts.hoodie} copy={a.compare} />
            </div>
          </Card>

          <Card lift className="flex flex-col justify-between gap-6 md:col-span-3 lg:col-span-1">
            <CardBody tag={h.control.review.tag} title={h.control.review.title} text={h.control.review.text} />
            <div aria-hidden="true" className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-fill text-white">
                  <Check className="h-4 w-4" />
                </span>
              ))}
            </div>
          </Card>

          <Card lift className="flex flex-col justify-between gap-6 md:col-span-3 lg:col-span-1">
            <CardBody tag={h.control.diag.tag} title={h.control.diag.title} text={h.control.diag.text} />
            <ul aria-label={h.control.diag.title} className="grid grid-cols-2 gap-2">
              {h.control.diag.labels.slice(0, 4).map((label) => (
                <li key={label} className="space-y-2 rounded-xl border border-line px-3 py-2.5">
                  <span className="block text-xs text-muted">{label}</span>
                  <span aria-hidden="true" className="block h-1.5 w-2/3 rounded-full bg-white/15" />
                </li>
              ))}
            </ul>
          </Card>

          <Card lift tone="outline" className="flex flex-col justify-between gap-6 md:col-span-3 lg:col-span-1">
            <CardBody tag={h.control.versions.tag} title={h.control.versions.title} text={h.control.versions.text} />
            <div aria-hidden="true" className="flex shrink-0 items-center gap-3">
              <span className="flex flex-col items-center gap-1.5">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line text-sm font-semibold">v1</span>
                <span className="text-xs text-muted">{h.control.versions.original}</span>
              </span>
              <GitCompare className="h-5 w-5 text-accent" />
              <span className="flex flex-col items-center gap-1.5">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-fill text-sm font-semibold text-white">v2</span>
                <span className="text-xs text-muted">{h.control.versions.optimized}</span>
              </span>
            </div>
          </Card>

          <Card lift className="space-y-4 md:col-span-3 lg:col-span-1">
            <CardBody tag={h.control.export.tag} title={h.control.export.title} text={h.control.export.text} />
            <ul className="space-y-2">
              {(
                [
                  ["GLB", h.control.export.glb],
                  ["OBJ", h.control.export.obj],
                  ["STL", h.control.export.stl],
                ] as const
              ).map(([format, note]) => (
                <li key={format} className="flex items-center gap-3">
                  <span aria-hidden="true" className="flex h-8 w-12 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-semibold text-fg">
                    {format}
                  </span>
                  <span className="text-xs leading-snug text-muted">
                    <span className="sr-only">{format}: </span>
                    {note}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      {/* 6. Who it is for: one tab each, with the model and the text changing together. */}
      <Section>
        <SectionTitle sub={c.uses.sub}>{c.uses.title}</SectionTitle>
        <AudienceTiles tiles={tiles} locale={locale} />
      </Section>

      {/* 7. Gallery: only when real, approved results exist. */}
      {posters.length >= 3 && (
        <Section>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {posters.slice(0, 8).map((s) => (
              <li key={s.id} className="card reveal overflow-hidden">
                <Image src={s.poster.src} width={s.poster.width} height={s.poster.height} alt={s.alt[locale]} className="h-auto w-full" />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 8. Connections: the three connection models, each with the status it really has. */}
      <Section>
        <SectionTitle sub={c.connections.sub}>{c.connections.title}</SectionTitle>
        <ConnectionsBand
          ints={h.ints}
          statusLabels={h.intStatus}
          copy={c.connections}
          models={{ shopify: model("green-shopping-bag-with-logo"), blender: model("blender-logo"), engines: model("dark-frame-block") }}
          locale={locale}
          allHref={localePath(locale, "/integrations")}
          allLabel={h.intCta}
        />
      </Section>

      {/* 9. What to expect and the questions, side by side. */}
      <Section>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <h2 className="text-[clamp(1.75rem,3.4vw,2.45rem)] font-semibold leading-tight">{c.expect.title}</h2>
            <Card tone="outline" className="space-y-6">
              <Checklist items={h.expectItems} />
              <TextLink href={localePath(locale, "/compare/ai-3d-vs-manual")}>{h.expectLink}</TextLink>
            </Card>
          </div>
          <div className="space-y-6">
            <h2 className="text-[clamp(1.75rem,3.4vw,2.45rem)] font-semibold leading-tight">{h.faqTitle}</h2>
            <FaqList items={h.faqs} />
          </div>
        </div>
      </Section>

      {/* 10. Closing: an emissive model turning on its stage. */}
      <ClosingBanner
        titleA={h.finalTitleA}
        titleB={h.finalTitleB}
        cta={h.finalCta}
        href={create}
        note={h.finalNote}
        visual={
          <figure className="flex w-full flex-col items-center" data-testid="art-figure" aria-label={c.closing.stageLabel}>
            <ArtImage image={golem.beauty} alt={golem.alt[locale]} sizes="(min-width: 768px) 320px, 70vw" className="art-float h-auto w-56 md:w-72" />
          </figure>
        }
      />
    </MarketingShell>
  );
}
