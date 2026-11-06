import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { MarketingShell } from "@/components/marketing-shell";
import { ModelViewerBox } from "@/components/model-viewer-box";
import { showcaseBeforeAfter, showcaseFor, showcaseHero, showcaseText } from "@/config/showcase";
import type { Category } from "@/lib/types";

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

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();
  const h = dict.home;

  const heroEntry = showcaseHero();
  const beforeAfter = showcaseBeforeAfter();
  const textEntry = showcaseText();
  const create = localePath(locale, "/dashboard/create");

  const monthlyPlans = dict.pricing.plans;

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

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* 1. Hero: one orange field. Corner labels, a giant ghost word and the real model on top. */}
      <section className="hero-field relative overflow-hidden">
        <div className="container-page relative flex min-h-[620px] flex-col pb-8 pt-6 md:min-h-[720px] md:pb-10">
          <div className="flex items-start justify-between gap-6 text-xs font-semibold uppercase tracking-wider">
            <span>{h.labelLeft}</span>
            <span className="text-right">{h.labelRight}</span>
          </div>

          <div className="relative z-10 mt-8 grid grid-cols-1 gap-8 md:mt-10 lg:grid-cols-12 lg:gap-10">
            <h1 className="font-display text-[clamp(2.5rem,5.4vw,4.75rem)] font-bold leading-[0.98] tracking-tight lg:col-span-8">
              {h.heroTitle}
            </h1>
            <div className="flex flex-col justify-end gap-6 lg:col-span-4">
              <p className="text-base font-medium leading-relaxed md:text-lg">{h.heroText}</p>
              <div className="flex flex-wrap gap-3">
                <Link href={create} data-testid="hero-cta-primary" className="btn-pill btn-ink">
                  {h.ctaPrimary}
                </Link>
                <Link href={localePath(locale, "/examples")} className="btn-pill btn-outline">
                  {h.ctaSecondary}
                </Link>
              </div>
            </div>
          </div>

          <div className="relative mt-2 flex flex-1 flex-col justify-end">
            {/* The ghost word is a layout element behind the model, centred on it. */}
            <div
              aria-hidden="true"
              className="hero-ghost absolute inset-x-0 top-[44%] -translate-y-1/2 text-center text-[clamp(10rem,34vw,31rem)]"
            >
              {h.ghostWord}
            </div>
            <div className="relative z-10 mx-auto w-full max-w-3xl">
              <ModelViewerBox
                bare
                src={heroEntry ? heroEntry.glb : "/demo/vase.glb"}
                alt={heroEntry ? heroEntry.alt[locale] : h.viewerAlt}
                heightClass="h-[300px] sm:h-[360px] lg:h-[400px]"
                testId="hero-model-viewer"
                wheelZoom={false}
                {...viewerLabels}
              />
              <p className="mt-2 text-center text-xs font-medium">
                {heroEntry
                  ? heroEntry.kind === "text"
                    ? h.generatedText
                    : h.generatedPhotos.replace("{n}", String(heroEntry.photos.length))
                  : h.viewerCaption}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Editorial statement: large grey type, no figures. */}
      <section className="border-b border-line py-20 md:py-32">
        <div className="container-page">
          <p className="max-w-5xl text-3xl font-semibold leading-[1.12] tracking-tight text-muted md:text-5xl lg:text-6xl">
            <span className="text-fg">{h.statementLead}</span> {h.statement}
          </p>
        </div>
      </section>

      {/* 3. Photos in, model out. Rendered only when a real, approved result exists. */}
      {beforeAfter && (
        <section className="border-b border-line py-16 md:py-24">
          <div className="container-page space-y-10">
            <div className="max-w-2xl space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-accent">{h.beforeEyebrow}</div>
              <h2 className="font-display text-3xl font-bold md:text-5xl">{h.beforeTitle}</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="space-y-3 lg:col-span-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted">{h.photosLabel}</div>
                <ul className="grid grid-cols-2 gap-3">
                  {beforeAfter.photos.map((p) => (
                    <li key={p.view} className="space-y-1.5">
                      <Image
                        src={p.src}
                        width={p.width}
                        height={p.height}
                        alt={`${beforeAfter.title[locale]} · ${dict.dash.create.views[p.view]}`}
                        className="h-auto w-full rounded-xl border border-line"
                        sizes="(min-width: 1024px) 20vw, 45vw"
                      />
                      <span className="block text-xs text-muted">{dict.dash.create.views[p.view]}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3 lg:col-span-7">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted">{h.modelLabel}</div>
                <ModelViewerBox
                  src={beforeAfter.glb}
                  alt={beforeAfter.alt[locale]}
                  heightClass="h-[360px] md:h-[460px]"
                  testId="home-before-after-viewer"
                  wheelZoom={false}
                  {...viewerLabels}
                />
                <p className="text-xs text-muted">{h.generatedPhotos.replace("{n}", String(beforeAfter.photos.length))}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Store categories as big type. A poster appears only when a real result exists for the category. */}
      <section className="border-b border-line py-16 md:py-24">
        <div className="container-page space-y-10">
          <div className="max-w-2xl space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-accent">{h.industriesEyebrow}</div>
            <h2 className="font-display text-3xl font-bold md:text-5xl">{h.industriesTitle}</h2>
          </div>
          <ul className="border-b border-line">
            {h.industries.map((it) => {
              const entry = showcaseFor(it.category as Category);
              return (
                <li key={it.category} className="border-t border-line">
                  <Link
                    href={create}
                    className="group grid grid-cols-1 items-center gap-4 py-8 md:grid-cols-12 md:gap-8 md:py-10"
                  >
                    <span className="font-display text-5xl font-bold tracking-tight transition-colors group-hover:text-accent group-focus-visible:text-accent md:col-span-6 md:text-7xl">
                      {it.name}
                    </span>
                    <span className="max-w-md text-base leading-relaxed text-muted md:col-span-4">{it.text}</span>
                    {entry ? (
                      <Image
                        src={entry.poster.src}
                        width={entry.poster.width}
                        height={entry.poster.height}
                        alt={entry.alt[locale]}
                        className="h-auto w-full max-w-[160px] rounded-xl border border-line md:col-span-2 md:justify-self-end"
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            {h.industriesNote}{" "}
            <Link href={localePath(locale, "/compare/ai-3d-vs-manual")} className="font-semibold text-fg underline underline-offset-4 hover:text-accent">
              {dict.nav.compare}
            </Link>
          </p>
        </div>
      </section>

      {/* 5. How it works: three steps with big numerals, no icons. */}
      <section className="border-b border-line py-16 md:py-24">
        <div className="container-page space-y-12">
          <div className="max-w-2xl space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-accent">{h.stepsEyebrow}</div>
            <h2 className="font-display text-3xl font-bold md:text-5xl">{h.stepsTitle}</h2>
          </div>
          <ol className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-0">
            {h.steps.map((s, i) => (
              <li key={s.title} className={`space-y-4 md:px-8 md:first:pl-0 md:last:pr-0 ${i > 0 ? "md:border-l md:border-line" : ""}`}>
                <div aria-hidden="true" className="font-display text-7xl font-bold leading-none text-accent md:text-8xl">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="font-display text-2xl font-bold">{s.title}</h3>
                <p className="text-base leading-relaxed text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
          <p className="text-sm text-muted">{h.stepsNote}</p>
        </div>
      </section>

      {/* 6. Also for everything else: clearly smaller than the store sections. */}
      <section className="border-b border-line py-16 md:py-24">
        <div className="container-page space-y-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-3 lg:col-span-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-accent">{h.moreEyebrow}</div>
              <h2 className="font-display text-3xl font-bold md:text-4xl">{h.moreTitle}</h2>
            </div>
            <p className="max-w-md text-base leading-relaxed text-muted lg:col-span-6">{h.moreIntro}</p>
          </div>
          <ul className="border-b border-line">
            {h.more.map((m) => (
              <li key={m.title} className="grid grid-cols-1 gap-3 border-t border-line py-6 md:grid-cols-12 md:gap-8">
                <h3 className="font-display text-xl font-bold md:col-span-4 md:text-2xl">{m.title}</h3>
                <p className="max-w-xl text-base leading-relaxed text-muted md:col-span-8">{m.text}</p>
              </li>
            ))}
          </ul>
          {textEntry && (
            <figure className="grid grid-cols-1 items-center gap-6 md:grid-cols-12">
              <Image
                src={textEntry.poster.src}
                width={textEntry.poster.width}
                height={textEntry.poster.height}
                alt={textEntry.alt[locale]}
                className="h-auto w-full max-w-xs rounded-xl border border-line md:col-span-4"
              />
              <figcaption className="space-y-2 md:col-span-8">
                {textEntry.prompt ? <blockquote className="text-lg leading-relaxed">“{textEntry.prompt}”</blockquote> : null}
                <p className="text-xs text-muted">{h.generatedText}</p>
              </figcaption>
            </figure>
          )}
        </div>
      </section>

      {/* 7. Pricing in flat columns. */}
      <section className="border-b border-line py-16 md:py-24">
        <div className="container-page space-y-12">
          <div className="max-w-2xl space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-accent">{h.pricingEyebrow}</div>
            <h2 className="font-display text-3xl font-bold md:text-5xl">{h.pricingTitle}</h2>
            <p className="text-base leading-relaxed text-muted">{h.pricingIntro}</p>
          </div>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-0">
            {monthlyPlans.map((p, i) => (
              <div key={p.id} className={`space-y-5 lg:px-7 lg:first:pl-0 lg:last:pr-0 ${i > 0 ? "lg:border-l lg:border-line" : ""}`}>
                <div className="flex items-center gap-3">
                  <h3 className="font-display text-xl font-bold">{p.name}</h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-5xl font-bold leading-none">US${p.price}</span>
                  <span className="text-sm text-muted">{dict.pricing.perMonth}</span>
                </div>
                <p className="text-sm font-semibold text-accent">
                  {p.credits.toLocaleString(locale)} {dict.pricing.credits}
                </p>
                <ul className="space-y-2 text-sm text-muted">
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                  {p.planned.map((pl) => (
                    <li key={pl}>
                      {pl} ({dict.pricing.plannedLabel})
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-xl text-sm text-muted">{h.tryPackNote}</p>
            <Link href={localePath(locale, "/pricing")} className="btn-pill btn-outline">
              {h.pricingCta}
            </Link>
          </div>
        </div>
      </section>

      {/* 8. FAQ: native details elements. */}
      <section className="border-b border-line py-16 md:py-24">
        <div className="container-page grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-accent">{h.faqEyebrow}</div>
            <h2 className="font-display text-3xl font-bold md:text-4xl">{h.faqTitle}</h2>
            <Link href={localePath(locale, "/resources/faq")} className="inline-block text-sm font-semibold text-fg underline underline-offset-4 hover:text-accent">
              {dict.nav.faq}
            </Link>
          </div>
          <div className="border-b border-line lg:col-span-8">
            {h.faqs.map((f) => (
              <details key={f.q} className="group border-t border-line py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold">
                  <span>{f.q}</span>
                  <span aria-hidden="true" className="font-display text-2xl leading-none text-accent">
                    <span className="group-open:hidden">+</span>
                    <span className="hidden group-open:inline">−</span>
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Final call to action on the orange field. */}
      <section className="hero-field">
        <div className="container-page flex flex-col items-start gap-6 py-20 md:py-28">
          <h2 className="font-display max-w-4xl text-[clamp(2.25rem,5.5vw,4.75rem)] font-bold leading-[1.02] tracking-tight">{h.finalTitle}</h2>
          <p className="max-w-xl text-base font-medium leading-relaxed md:text-lg">{h.finalText}</p>
          <Link href={create} className="btn-pill btn-ink">
            {h.finalCta}
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
