import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, Box, Check, Code2, Download, Image as ImageIcon, Plug, Store, Type, Webhook } from "lucide-react";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { MarketingShell } from "@/components/marketing-shell";
import { ModelViewerBox } from "@/components/model-viewer-box";
import { PlanCards } from "@/components/plan-cards";
import { planReference } from "@/lib/provider/registry";
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

/** Section title: one centred line, no eyebrow. */
function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="reveal mx-auto max-w-2xl space-y-3 text-center">
      <h2 className="text-[clamp(1.75rem,3.4vw,2.45rem)] font-semibold leading-tight">{children}</h2>
      {sub ? <p className="text-base leading-relaxed text-muted">{sub}</p> : null}
    </div>
  );
}

/** A label inside a card: a pill with a square arrow button at the end. */
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="tag-pill">
      {children}
      <span className="tag-arrow" aria-hidden="true">
        <ArrowUpRight className="h-4 w-4" />
      </span>
    </span>
  );
}

/** A drawn tile for diagrams: an icon in a rounded square. Not a screenshot, never presented as a result. */
function Tile({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <span className="flex flex-col items-center gap-1.5">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-surface-2 text-fg">{children}</span>
      {label ? <span className="text-xs text-muted">{label}</span> : null}
    </span>
  );
}

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

  const flowIcons = [Code2, Webhook, Plug, Box, Store];

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* 1. Hero: giant title, then the model over a giant outlined "3D". */}
      <section className="relative overflow-hidden pb-6 pt-32 md:pt-40">
        <div className="container-page relative flex flex-col items-center text-center">
          <span className="tag-pill !pr-4">{h.pill}</span>
          <h1 className="hero-title mt-6 max-w-5xl text-[clamp(2.4rem,5.5vw,4.5rem)]">{h.heroTitle}</h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">{h.heroText}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href={create} data-testid="hero-cta-primary" className="btn-pill btn-solid py-3.5">
              {h.ctaPrimary}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href={localePath(locale, "/examples")} className="btn-pill btn-outline py-3.5">
              {h.ctaSecondary}
            </Link>
          </div>

          <div className="relative mt-4 w-full max-w-3xl">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-center text-[clamp(11rem,38vw,26rem)] font-bold leading-none text-transparent"
              style={{ WebkitTextStroke: "1.5px rgb(239 43 45 / 0.38)" }}
            >
              {h.ghostWord}
            </div>
            <div className="float-slow relative z-10">
              <ModelViewerBox
                bare
                src={heroEntry ? heroEntry.glb : "/demo/vase.glb"}
                alt={heroEntry ? heroEntry.alt[locale] : h.viewerAlt}
                heightClass="h-[320px] sm:h-[400px] lg:h-[460px]"
                testId="hero-model-viewer"
                wheelZoom={false}
                {...viewerLabels}
              />
            </div>
            <p className="relative z-10 mt-1 text-xs text-muted">
              {heroEntry
                ? heroEntry.kind === "text"
                  ? h.generatedText
                  : h.generatedPhotos.replace("{n}", String(heroEntry.photos.length))
                : h.viewerCaption}
            </p>
          </div>
        </div>
      </section>

      {/* 2. Create: one wide card and three small ones, mixed sizes. */}
      <section className="py-20 md:py-28">
        <div className="container-page space-y-10">
          <SectionTitle>{h.createTitle}</SectionTitle>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <article className="card card-lift reveal flex flex-col justify-between gap-8 overflow-hidden p-7 md:col-span-4 md:p-9">
              <div className="space-y-4">
                <Tag>{h.create.photo.tag}</Tag>
                <h3 className="max-w-md text-2xl font-semibold leading-tight">{h.create.photo.title}</h3>
                <p className="max-w-md text-sm leading-relaxed text-muted">{h.create.photo.text}</p>
              </div>
              <div aria-hidden="true" className="flex items-center gap-3 sm:gap-5">
                <Tile label={views.front}>
                  <ImageIcon className="h-6 w-6" />
                </Tile>
                <Tile label={views.back}>
                  <ImageIcon className="h-6 w-6" />
                </Tile>
                <Tile label={views.left}>
                  <ImageIcon className="h-6 w-6" />
                </Tile>
                <ArrowRight className="h-5 w-5 shrink-0 text-accent" />
                <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blood text-white sm:h-24 sm:w-24">
                  <Box className="h-9 w-9" />
                </span>
              </div>
            </article>

            <article className="card card-lift reveal flex flex-col justify-between gap-8 p-7 md:col-span-2">
              <div className="space-y-4">
                <Tag>{h.create.text.tag}</Tag>
                <h3 className="text-xl font-semibold leading-tight">{h.create.text.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{h.create.text.text}</p>
              </div>
              <div aria-hidden="true" className="flex items-center gap-3">
                <Tile>
                  <Type className="h-6 w-6" />
                </Tile>
                <ArrowRight className="h-5 w-5 text-accent" />
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blood text-white">
                  <Box className="h-6 w-6" />
                </span>
              </div>
            </article>

            <article className="card card-lift reveal space-y-3 p-7 md:col-span-3">
              <Tag>{h.create.views.tag}</Tag>
              <h3 className="text-xl font-semibold leading-tight">{h.create.views.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{h.create.views.text}</p>
            </article>

            <article className="card card-lift reveal space-y-3 p-7 md:col-span-3">
              <Tag>{h.create.status.tag}</Tag>
              <h3 className="text-xl font-semibold leading-tight">{h.create.status.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{h.create.status.text}</p>
            </article>

            {/* Only when a real, approved result exists. */}
            {beforeAfter && (
              <article className="card reveal grid grid-cols-1 gap-6 p-7 md:col-span-6 md:grid-cols-12">
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
              </article>
            )}
          </div>
        </div>
      </section>

      {/* 3. Control: the mesh view is real and interactive; the other three are plain cards. */}
      <section className="py-16 md:py-24">
        <div className="container-page space-y-10">
          <SectionTitle>{h.controlTitle}</SectionTitle>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <article className="card reveal grid grid-cols-1 gap-4 overflow-hidden p-7 md:col-span-6 md:grid-cols-2 md:p-9">
              <div className="flex flex-col justify-center space-y-4">
                <Tag>{h.control.mesh.tag}</Tag>
                <h3 className="text-2xl font-semibold leading-tight">{h.control.mesh.title}</h3>
                <p className="max-w-sm text-sm leading-relaxed text-muted">{h.control.mesh.text}</p>
                <p className="text-xs text-muted">{h.sampleNote}</p>
              </div>
              <ModelViewerBox
                src="/demo/chair.glb"
                alt={h.meshAlt}
                heightClass="h-[300px] md:h-[360px]"
                testId="home-mesh-viewer"
                wheelZoom={false}
                wireframeLabel={dict.dash.detail.wireframe}
                surfaceLabel={dict.dash.detail.surface}
                {...viewerLabels}
              />
            </article>

            <article className="card card-lift reveal space-y-4 p-7 md:col-span-2">
              <Tag>{h.control.review.tag}</Tag>
              <h3 className="text-lg font-semibold leading-tight">{h.control.review.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{h.control.review.text}</p>
              <div aria-hidden="true" className="flex gap-1.5 pt-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="flex h-7 w-7 items-center justify-center rounded-lg bg-blood text-white">
                    <Check className="h-4 w-4" />
                  </span>
                ))}
              </div>
            </article>

            <article className="card card-lift reveal space-y-4 p-7 md:col-span-2">
              <Tag>{h.control.versions.tag}</Tag>
              <h3 className="text-lg font-semibold leading-tight">{h.control.versions.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{h.control.versions.text}</p>
            </article>

            <article className="card card-lift reveal space-y-4 p-7 md:col-span-2">
              <Tag>{h.control.export.tag}</Tag>
              <h3 className="text-lg font-semibold leading-tight">{h.control.export.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{h.control.export.text}</p>
            </article>
          </div>
        </div>
      </section>

      {/* 4. Three steps, each with a small drawn diagram. */}
      <section className="py-16 md:py-24">
        <div className="container-page space-y-10">
          <SectionTitle sub={h.stepsNote}>{h.stepsTitle}</SectionTitle>
          <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {h.steps.map((s, i) => {
              const Icon = [ImageIcon, Box, Download][i] ?? Box;
              return (
                <li key={s.title} className="card reveal flex flex-col gap-6 p-7">
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold tabular-nums" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span aria-hidden="true" className="mesh-lines flex h-16 w-24 items-center justify-center rounded-xl bg-[#1b0b0c]">
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
        </div>
      </section>

      {/* 5. One flow per trade. */}
      <section className="py-16 md:py-24">
        <div className="container-page space-y-10">
          <SectionTitle>{h.tradesTitle}</SectionTitle>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            {h.trades.map((t, i) => (
              <article
                key={t.name}
                className={`card card-lift reveal flex flex-col justify-between gap-8 p-7 md:p-9 ${i === 0 ? "md:col-span-3" : i === 1 ? "md:col-span-2" : "md:col-span-5 md:flex-row md:items-end"}`}
              >
                <div className="space-y-4">
                  <Tag>{t.name}</Tag>
                  <h3 className="max-w-md text-2xl font-semibold leading-tight">{t.line}</h3>
                  <ul className="space-y-2 text-sm text-muted">
                    {t.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href={create} className="btn-pill btn-outline self-start md:shrink-0">
                  {t.cta}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
          <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
            {h.tradesNote}{" "}
            <Link href={localePath(locale, "/compare/ai-3d-vs-manual")} className="font-semibold text-fg underline underline-offset-4 hover:text-accent">
              {dict.nav.compare}
            </Link>
          </p>
        </div>
      </section>

      {/* 6. Gallery: only when real, approved results exist. */}
      {posters.length >= 3 && (
        <section className="py-16 md:py-24">
          <div className="container-page">
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {posters.slice(0, 8).map((s) => (
                <li key={s.id} className="card reveal overflow-hidden">
                  <Image src={s.poster.src} width={s.poster.width} height={s.poster.height} alt={s.alt[locale]} className="h-auto w-full" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 7. In your workflow. Shopify stays "coming soon" until it is tried on a real store. */}
      <section className="py-16 md:py-24">
        <div className="container-page space-y-10">
          <SectionTitle sub={h.flowIntro}>{h.flowTitle}</SectionTitle>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {h.flow.map((f, i) => {
              const Icon = flowIcons[i] ?? Box;
              return (
                <li key={f.title} className="card reveal flex flex-col gap-4 p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-fg" aria-hidden="true">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="space-y-1.5">
                    <h3 className="flex items-center gap-2 text-base font-semibold">
                      {f.title}
                      {"badge" in f && f.badge ? (
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-muted">{f.badge}</span>
                      ) : null}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted">{f.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 8. Pricing. */}
      <section className="py-16 md:py-24">
        <div className="container-page space-y-10">
          <SectionTitle sub={h.pricingIntro}>{h.pricingTitle}</SectionTitle>
          <div className="card reveal p-6 md:p-9">
            <PlanCards copy={dict.pricing} locale={locale} reference={planReference()} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-xl text-sm text-muted">{h.tryPackNote}</p>
            <Link href={localePath(locale, "/pricing")} className="btn-pill btn-outline">
              {h.pricingCta}
            </Link>
          </div>
        </div>
      </section>

      {/* 9. FAQ. */}
      <section className="py-16 md:py-24">
        <div className="container-page space-y-10">
          <SectionTitle>{h.faqTitle}</SectionTitle>
          <div className="mx-auto max-w-3xl space-y-3">
            {h.faqs.map((f) => (
              <details key={f.q} className="card reveal group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-semibold">
                  <span>{f.q}</span>
                  <span aria-hidden="true" className="text-2xl font-normal leading-none text-accent">
                    <span className="group-open:hidden">+</span>
                    <span className="hidden group-open:inline">−</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Closing banner on a starfield. */}
      <section className="px-5 pb-20 pt-8 md:pb-28">
        <div
          className="reveal relative mx-auto flex max-w-[1120px] flex-col items-center gap-6 overflow-hidden rounded-[32px] px-6 py-20 text-center md:py-28"
          style={{
            backgroundColor: "#1a0506",
            backgroundImage: [
              "radial-gradient(ellipse 70% 90% at 50% 120%, #8b0000 0%, rgb(139 0 0 / 0) 70%)",
              "radial-gradient(1.5px 1.5px at 12% 24%, #fff, transparent)",
              "radial-gradient(1px 1px at 27% 68%, #fff, transparent)",
              "radial-gradient(1.5px 1.5px at 41% 15%, #fff, transparent)",
              "radial-gradient(1px 1px at 58% 78%, #fff, transparent)",
              "radial-gradient(2px 2px at 73% 30%, #fff, transparent)",
              "radial-gradient(1px 1px at 86% 62%, #fff, transparent)",
              "radial-gradient(1.5px 1.5px at 92% 14%, #fff, transparent)",
              "radial-gradient(1px 1px at 6% 82%, #fff, transparent)",
              "radial-gradient(1px 1px at 66% 10%, #fff, transparent)",
              "radial-gradient(1.5px 1.5px at 34% 88%, #fff, transparent)",
            ].join(","),
          }}
        >
          <h2 className="text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.05]">
            {h.finalTitleA}
            <br />
            <span className="bg-gradient-to-r from-white to-[#ffb3b3] bg-clip-text text-transparent">{h.finalTitleB}</span>
          </h2>
          <Link href={create} className="btn-pill btn-ink py-3.5">
            {h.finalCta}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="max-w-md text-sm text-white/70">{h.finalNote}</p>
        </div>
      </section>
    </MarketingShell>
  );
}
