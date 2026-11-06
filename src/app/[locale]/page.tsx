import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Armchair,
  ArrowRight,
  Box,
  Check,
  Code2,
  Coins,
  FileBox,
  Footprints,
  Gamepad2,
  GitCompare,
  Image as ImageIcon,
  Lamp,
  MapPinOff,
  PenTool,
  Plug,
  Shirt,
  ShoppingCart,
  Store,
  Type,
  Webhook,
} from "lucide-react";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { MarketingShell } from "@/components/marketing-shell";
import { ModelViewerBox } from "@/components/model-viewer-box";
import { ModelSilhouette, type SilhouetteKind } from "@/components/model-silhouette";
import { HeroShelf, type ShelfItem } from "@/components/home/hero-shelf";
import {
  Card,
  CardBody,
  Checklist,
  ClosingBanner,
  FaqList,
  Pill,
  Section,
  SectionTitle,
  StatusBadge,
  Tile,
  cardToneClass,
} from "@/components/marketing-kit";
import { showcase, showcaseBeforeAfter, showcaseHero } from "@/config/showcase";

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

/** The 3D result in a diagram: a flat drawing of a demo model, never a render. */
function ResultModel({ kind, size = "md" }: { kind: SilhouetteKind; size?: "md" | "lg" }) {
  return <ModelSilhouette kind={kind} className={size === "lg" ? "h-24 w-24 sm:h-28 sm:w-28" : "h-16 w-16"} />;
}

/** Vase-like silhouette used by the "surface and mesh" drawing. */
const VASE = "polygon(36% 0, 64% 0, 64% 16%, 86% 44%, 86% 80%, 70% 100%, 30% 100%, 14% 80%, 14% 44%, 36% 16%)";

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();
  const h = dict.home;

  const heroEntry = showcaseHero();
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

  /** The shelf under the hero model. A real approved result leads when one exists; the three demo samples always follow. */
  const shelfItems: ShelfItem[] = [
    ...(heroEntry
      ? [
          {
            id: "result",
            src: heroEntry.glb,
            alt: heroEntry.alt[locale],
            label: heroEntry.title[locale],
            icon: "vase" as const,
            caption: heroEntry.kind === "text" ? h.generatedText : h.generatedPhotos.replace("{n}", String(heroEntry.photos.length)),
          },
        ]
      : []),
    ...(["vase", "lamp", "chair"] as const).map((k) => ({
      id: k,
      src: `/demo/${k}.glb`,
      alt: h.shelfAlts[k],
      label: h.shelfNames[k],
      icon: k,
      caption: h.viewerCaption,
    })),
  ];

  const intIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    embed: Code2,
    shopify: Store,
    blender: Box,
    api: Webhook,
    mcp: Plug,
    woo: ShoppingCart,
    engines: Gamepad2,
  };
  const intSpan: Record<string, string> = {
    embed: "md:col-span-4",
    shopify: "md:col-span-2",
    blender: "md:col-span-2",
    api: "md:col-span-2",
    mcp: "md:col-span-2",
    woo: "md:col-span-3",
    engines: "md:col-span-3",
  };
  const intTone = (status: string) => (status === "available" ? "ok" : status === "testing" ? "warn" : "muted");
  const storeIcons = [Shirt, Armchair, Footprints, Lamp];
  const stepIcons = [ImageIcon, Box, FileBox];

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* 1. Hero: text on the left, the model on a shelf on the right (stacked on small screens). */}
      <section className="relative overflow-hidden pb-6 pt-28 md:pt-36 lg:pt-32">
        <div className="container-page relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-4">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <Pill>{h.pill}</Pill>
            <h1 className="hero-title mt-6 max-w-3xl text-[clamp(2.4rem,4.6vw,4rem)]">{h.heroTitle}</h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">{h.heroText}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link href={create} data-testid="hero-cta-primary" className="btn-pill btn-solid py-3.5">
                {h.ctaPrimary}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href={localePath(locale, "/examples")} className="btn-pill btn-outline py-3.5">
                {h.ctaSecondary}
              </Link>
            </div>
          </div>

          <HeroShelf items={shelfItems} shelfLabel={h.shelfLabel} ghostWord={h.ghostWord} viewerLabels={viewerLabels} />
        </div>
      </section>

      {/* 2. Three ways in: image, text and several images, each with a drawn diagram and a link to its page. */}
      <Section>
        <SectionTitle sub={h.waysSub}>{h.waysTitle}</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <Card lift className="flex flex-col justify-between gap-10 overflow-hidden md:col-span-4">
            <CardBody tag={h.ways.image.tag} title={h.ways.image.title} text={h.ways.image.text} />
            <div className="space-y-6">
              <div className="flex items-center gap-4 sm:gap-6">
                <span
                  aria-hidden="true"
                  className="mesh-lines flex h-24 w-28 shrink-0 items-center justify-center rounded-2xl border border-line bg-[#151230] sm:h-28 sm:w-36"
                >
                  <ImageIcon className="h-8 w-8 text-accent" />
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                {beforeAfter ? (
                  <ResultModel kind="vase" size="lg" />
                ) : (
                  // A live demo vase. Skipped when a real before/after viewer is shown below, to keep the page light.
                  <div className="min-w-0 flex-1 space-y-1">
                    <ModelViewerBox
                      bare
                      src="/demo/vase.glb"
                      alt={h.shelfAlts.vase}
                      heightClass="h-[150px] sm:h-[180px]"
                      testId="home-ways-viewer"
                      wheelZoom={false}
                      {...viewerLabels}
                    />
                    <p className="text-xs text-muted">{h.sampleNote}</p>
                  </div>
                )}
              </div>
              <TextLink href={localePath(locale, "/features/image-to-3d")}>{h.ways.image.cta}</TextLink>
            </div>
          </Card>

          <Card lift className="flex flex-col justify-between gap-8 md:col-span-2">
            <CardBody tag={h.ways.text.tag} title={h.ways.text.title} text={h.ways.text.text} />
            <div className="space-y-6">
              <div aria-hidden="true" className="space-y-4">
                <div className="space-y-1.5 rounded-xl border border-line px-4 py-3">
                  <span className="flex items-center gap-2 text-xs text-muted">
                    <Type className="h-3.5 w-3.5 text-accent" />
                    {h.ways.text.promptLabel}
                  </span>
                  <span className="block text-sm leading-snug text-fg">{h.ways.text.promptExample}</span>
                </div>
                <div className="flex items-center gap-3">
                  <ArrowRight className="h-5 w-5 shrink-0 text-accent" />
                  <ResultModel kind="chair" />
                </div>
              </div>
              <TextLink href={localePath(locale, "/features/text-to-3d")}>{h.ways.text.cta}</TextLink>
            </div>
          </Card>

          <Card lift tone="outline" className="grid grid-cols-1 gap-8 overflow-hidden md:col-span-6 md:grid-cols-2 md:items-center">
            <div className="flex flex-col items-start gap-6">
              <CardBody tag={h.ways.multi.tag} title={h.ways.multi.title} text={h.ways.multi.text} />
              <TextLink href={localePath(locale, "/features/multi-image-to-3d")}>{h.ways.multi.cta}</TextLink>
            </div>
            <div aria-hidden="true" className="space-y-3">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <Tile key={i}>
                      <ImageIcon className="h-6 w-6" />
                    </Tile>
                  ))}
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 rotate-90 text-accent sm:rotate-0" />
                <ResultModel kind="lamp" size="lg" />
              </div>
              <p className="text-xs text-muted">{[views.front, views.left, views.back, views.right].join(", ")}</p>
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

          <Card lift className="space-y-4 md:col-span-2">
            <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-fg">
              <MapPinOff className="h-5 w-5" />
            </span>
            <CardBody tag={h.ways.privacy.tag} title={h.ways.privacy.title} text={h.ways.privacy.text} />
          </Card>

          <Card lift className="flex flex-col justify-between gap-8 md:col-span-4">
            <CardBody tag={h.ways.status.tag} title={h.ways.status.title} text={h.ways.status.text} />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div aria-hidden="true" className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs text-fg">
                  <Coins className="h-4 w-4 text-accent" />
                  {h.ways.status.costLabel}
                </span>
                <ArrowRight className="h-4 w-4 text-accent" />
                <ResultModel kind="vase" />
              </div>
              <TextLink href={localePath(locale, "/pricing")}>{h.ways.status.link}</TextLink>
            </div>
          </Card>
        </div>
      </Section>

      {/* 3. Control: the one red card of the page is a large model with the mesh toggle (viewer on the left on desktop). */}
      <Section>
        <SectionTitle sub={h.controlSub}>{h.controlTitle}</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <Card tone="red" className="grid grid-cols-1 items-center gap-6 overflow-hidden md:col-span-6 md:grid-cols-2 md:gap-10 md:p-9">
            <div className="md:order-2">
              <CardBody tag={h.control.mesh.tag} title={h.control.mesh.title} text={h.control.mesh.text}>
                <p className="text-xs text-muted">{h.sampleNote}</p>
              </CardBody>
            </div>
            <div className="md:order-1">
              <ModelViewerBox
                src="/demo/chair.glb"
                alt={h.meshAlt}
                heightClass="h-[320px] md:h-[440px]"
                provenanceBadge={h.sampleNote}
                testId="home-mesh-viewer"
                wheelZoom={false}
                wireframeLabel={dict.dash.detail.wireframe}
                surfaceLabel={dict.dash.detail.surface}
                {...viewerLabels}
              />
            </div>
          </Card>

          <Card lift className="flex flex-col justify-between gap-8 md:col-span-2">
            <CardBody tag={h.control.review.tag} title={h.control.review.title} text={h.control.review.text} />
            <div aria-hidden="true" className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className="flex h-8 w-8 items-center justify-center rounded-lg bg-blood text-white">
                  <Check className="h-4 w-4" />
                </span>
              ))}
            </div>
          </Card>

          <Card lift className="flex flex-col justify-between gap-8 md:col-span-4">
            <CardBody tag={h.control.diag.tag} title={h.control.diag.title} text={h.control.diag.text} />
            <ul aria-label={h.control.diag.title} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {h.control.diag.labels.map((label) => (
                <li key={label} className="space-y-2.5 rounded-xl border border-line px-3 py-3">
                  <span className="block text-xs text-muted">{label}</span>
                  <span aria-hidden="true" className="block h-1.5 w-2/3 rounded-full bg-white/15" />
                </li>
              ))}
            </ul>
          </Card>

          <Card lift tone="outline" className="flex flex-col justify-between gap-8 md:col-span-4 md:flex-row md:items-center">
            <CardBody tag={h.control.versions.tag} title={h.control.versions.title} text={h.control.versions.text} />
            <div aria-hidden="true" className="flex shrink-0 items-center gap-3">
              <span className="flex flex-col items-center gap-1.5">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line text-sm font-semibold">v1</span>
                <span className="text-xs text-muted">{h.control.versions.original}</span>
              </span>
              <GitCompare className="h-5 w-5 text-accent" />
              <span className="flex flex-col items-center gap-1.5">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blood text-sm font-semibold text-white">v2</span>
                <span className="text-xs text-muted">{h.control.versions.optimized}</span>
              </span>
            </div>
          </Card>

          <Card lift className="space-y-5 md:col-span-2">
            <CardBody tag={h.control.export.tag} title={h.control.export.title} text={h.control.export.text} />
            <ul className="space-y-2.5">
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

      {/* 4. Three steps in one outlined card, split by lines. */}
      <Section>
        <SectionTitle sub={h.stepsNote}>{h.stepsTitle}</SectionTitle>
        <Card tone="outline" className="!p-0">
          <ol className="grid grid-cols-1 divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
            {h.steps.map((s, i) => {
              const Icon = stepIcons[i] ?? Box;
              return (
                <li key={s.title} className="flex flex-col gap-6 p-7 md:p-8">
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold tabular-nums" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span aria-hidden="true" className="mesh-lines flex h-16 w-24 items-center justify-center rounded-xl bg-[#151230]">
                      <Icon className="h-7 w-7 text-accent" />
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{s.title}</h3>
                    <p className="text-sm leading-relaxed text-muted">{s.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      </Section>

      {/* 5. Who we help: stores as a full-width band with a demo lamp, then games and design side by side. */}
      <Section>
        <SectionTitle sub={h.whoSub}>{h.whoTitle}</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <Card lift className="grid grid-cols-1 gap-8 overflow-hidden md:col-span-6 md:grid-cols-2 md:gap-10 md:p-9">
            <div className="space-y-6">
              <CardBody tag={h.who.stores.tag} title={h.who.stores.title} text={h.who.stores.text} />
              <div className="flex flex-wrap gap-x-5 gap-y-3">
                {h.who.stores.categories.map((c, i) => {
                  const Icon = storeIcons[i] ?? Box;
                  return (
                    <Tile key={c} label={c}>
                      <Icon className="h-6 w-6" />
                    </Tile>
                  );
                })}
              </div>
              <Checklist items={h.who.stores.points} />
            </div>
            <div className="self-center">
              <ModelViewerBox
                src="/demo/lamp.glb"
                alt={h.shelfAlts.lamp}
                heightClass="h-[300px] md:h-[400px]"
                provenanceBadge={h.sampleNote}
                testId="home-stores-viewer"
                wheelZoom={false}
                {...viewerLabels}
              />
            </div>
            <div className="flex flex-col gap-5 border-t border-line pt-6 md:col-span-2 md:flex-row md:items-center md:justify-between md:gap-8">
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blood text-white">
                  <Shirt className="h-4 w-4" />
                </span>
                <div className="max-w-2xl space-y-1">
                  <p className="text-sm font-semibold leading-snug">{h.who.stores.apparelTitle}</p>
                  <p className="text-sm leading-relaxed text-muted">{h.who.stores.apparelText}</p>
                </div>
              </div>
              <TextLink href={localePath(locale, "/solutions/stores")}>{h.who.stores.cta}</TextLink>
            </div>
          </Card>

          <Card lift className="flex flex-col justify-between gap-8 md:col-span-3">
            <div className="space-y-5">
              <span aria-hidden="true" className="mesh-lines flex h-16 w-24 items-center justify-center rounded-xl bg-[#151230]">
                <Gamepad2 className="h-7 w-7 text-accent" />
              </span>
              <CardBody tag={h.who.games.tag} title={h.who.games.title} text={h.who.games.text} />
              <Checklist items={h.who.games.points} />
            </div>
            <TextLink href={localePath(locale, "/solutions/games")}>{h.who.games.cta}</TextLink>
          </Card>

          <Card lift tone="outline" className="flex flex-col justify-between gap-8 md:col-span-3">
            <div className="space-y-5">
              <span aria-hidden="true" className="mesh-lines flex h-16 w-24 items-center justify-center rounded-xl bg-[#151230]">
                <PenTool className="h-7 w-7 text-accent" />
              </span>
              <CardBody tag={h.who.design.tag} title={h.who.design.title} text={h.who.design.text} />
              <Checklist items={h.who.design.points} />
            </div>
            <TextLink href={localePath(locale, "/solutions/design")}>{h.who.design.cta}</TextLink>
          </Card>
        </div>
      </Section>

      {/* 6. The same model, solid and mesh: a flat drawing (CSS shapes), labelled as an illustration. */}
      <Section>
        <SectionTitle sub={h.twinText}>{h.twinTitle}</SectionTitle>
        <Card tone="outline" className="mx-auto max-w-3xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <figure className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-bg px-4 py-6">
              <span aria-hidden="true" className="block h-40 w-28 bg-blood sm:h-52 sm:w-36" style={{ clipPath: VASE }} />
              <figcaption className="text-sm font-medium text-fg">{h.twinSolid}</figcaption>
            </figure>
            <figure className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-bg px-4 py-6">
              <span aria-hidden="true" className="relative block h-40 w-28 bg-accent sm:h-52 sm:w-36" style={{ clipPath: VASE }}>
                <span className="mesh-lines absolute inset-[2px] block bg-[#151230]" style={{ clipPath: VASE }} />
              </span>
              <figcaption className="text-sm font-medium text-fg">{h.twinMesh}</figcaption>
            </figure>
          </div>
          <p className="text-center text-xs text-muted">{h.twinNote}</p>
        </Card>
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

      {/* 8. Integrations: the six first, with the status each one really has. Planned ones are dashed so live ones lead. */}
      <Section>
        <SectionTitle sub={h.intSub}>{h.intTitle}</SectionTitle>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {h.ints.map((it) => {
            const Icon = intIcons[it.key] ?? Box;
            const quiet = it.status === "planned" || it.status === "later";
            return (
              <li
                key={it.key}
                className={`card card-lift reveal flex flex-col gap-5 p-7 ${cardToneClass(quiet ? "planned" : "default")} ${intSpan[it.key] ?? "md:col-span-2"}`}
              >
                <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-fg">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold leading-tight">{it.name}</h3>
                    <StatusBadge tone={intTone(it.status)}>{h.intStatus[it.status as keyof typeof h.intStatus]}</StatusBadge>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">{it.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex justify-center">
          <Link href={localePath(locale, "/integrations")} className="btn-pill btn-outline">
            {h.intCta}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </Section>

      {/* 9. What to expect: the honest limits. */}
      <Section>
        <SectionTitle sub={h.expectSub}>{h.expectTitle}</SectionTitle>
        <Card tone="outline" className="mx-auto max-w-3xl space-y-6">
          <Checklist items={h.expectItems} />
          <TextLink href={localePath(locale, "/compare/ai-3d-vs-manual")}>{h.expectLink}</TextLink>
        </Card>
      </Section>

      {/* 10. FAQ. */}
      <Section>
        <SectionTitle>{h.faqTitle}</SectionTitle>
        <FaqList items={h.faqs} />
      </Section>

      {/* 11. Closing banner. */}
      <ClosingBanner titleA={h.finalTitleA} titleB={h.finalTitleB} cta={h.finalCta} href={create} note={h.finalNote} />
    </MarketingShell>
  );
}
