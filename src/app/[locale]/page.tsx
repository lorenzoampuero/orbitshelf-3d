import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ArrowUpRight } from "lucide-react";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { MarketingShell } from "@/components/marketing-shell";
import { ModelViewerBox } from "@/components/model-viewer-box";

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

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      {/* 1. Hero */}
      <section className="py-14 md:py-20">
        <div className="container-page grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-mint">
              {dict.home.heroEyebrow}
            </span>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-[1.06]">
              {dict.home.heroTitle}
            </h1>
            <p className="max-w-xl text-base sm:text-lg text-muted leading-relaxed">
              {dict.home.heroSubtitle}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href={localePath(locale, "/dashboard")}
                data-testid="hero-cta-primary"
                className="inline-flex items-center gap-2 rounded-xl bg-mint px-5 py-3 text-sm font-semibold text-bg hover:opacity-95"
              >
                <span>{dict.home.ctaPrimary}</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href={localePath(locale, "/examples")}
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold text-fg hover:border-mint"
              >
                {dict.home.ctaSecondary}
              </Link>
            </div>
            <p className="text-xs text-muted">{dict.home.microcopy}</p>
          </div>

          <div className="lg:col-span-5 space-y-2">
            <ModelViewerBox
              src="/demo/vase.glb"
              alt={dict.home.viewerAlt}
              hint={dict.home.viewerHint}
              provenanceBadge={dict.home.showcaseBadge}
              resetLabel={dict.dash.detail.resetView}
              autoRotateLabel={dict.dash.detail.autoRotate}
              autoRotateOffLabel={dict.dash.detail.autoRotateOff}
              loadingLabel={dict.dash.detail.viewerLoading}
              errorLabel={dict.dash.detail.viewerError}
              heightClass="h-[380px] sm:h-[420px]"
              testId="hero-model-viewer"
            />
            <p className="text-xs text-muted px-1">{dict.home.viewerCaption}</p>
          </div>
        </div>
      </section>

      {/* 2. Workflow */}
      <section className="border-t border-line py-16">
        <div className="container-page space-y-8">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-mint">
              {dict.home.workflowEyebrow}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">{dict.home.workflowTitle}</h2>
            <p className="text-sm text-muted">{dict.home.workflowIntro}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dict.home.steps.map((s, idx) => (
              <div key={s.title} className="rounded-[16px] border border-line bg-surface p-5 space-y-2">
                <div className="font-mono text-xs font-semibold text-mint">0{idx + 1}</div>
                <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                <p className="text-xs leading-relaxed text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Category showcase (labeled demo samples) */}
      <section className="border-t border-line py-16">
        <div className="container-page space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-mint">
                {dict.home.showcaseEyebrow}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold">{dict.home.showcaseTitle}</h2>
              <p className="text-sm text-muted">{dict.home.showcaseIntro}</p>
            </div>
            <Link
              href={localePath(locale, "/examples")}
              className="text-sm font-medium text-mint hover:underline shrink-0"
            >
              {dict.home.ctaSecondary} →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {dict.examples.items.map((item) => (
              <div key={item.id} className="rounded-[16px] border border-line bg-surface p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-fg">{item.name}</span>
                  <span className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-[11px] text-mint">
                    {dict.home.showcaseBadge}
                  </span>
                </div>
                <p className="text-xs text-muted">{item.text}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted">{dict.home.showcaseNote}</p>
        </div>
      </section>

      {/* 4. Capabilities */}
      <section className="border-t border-line py-16">
        <div className="container-page space-y-8">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-mint">
              {dict.home.capabilitiesEyebrow}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">{dict.home.capabilitiesTitle}</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dict.home.capabilities.map((cap) => (
              <div key={cap.title} className="rounded-[16px] border border-line bg-surface p-5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-base font-semibold">{cap.title}</h3>
                  <span className="rounded bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-violet">
                    {cap.status}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted">{cap.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Quality checklist proof */}
      <section className="border-t border-line py-16">
        <div className="container-page grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          <div className="lg:col-span-5 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-mint">
              {dict.home.qualityEyebrow}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">{dict.home.qualityTitle}</h2>
            <p className="text-sm text-muted leading-relaxed">{dict.home.qualityIntro}</p>
            <p className="text-xs text-muted">{dict.home.qualityNote}</p>
          </div>
          <ul className="lg:col-span-7 grid grid-cols-1 gap-3">
            {dict.home.quality.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-mint" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. Pricing preview */}
      <section className="border-t border-line py-16">
        <div className="container-page space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-mint">
                {dict.home.pricingEyebrow}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold">{dict.home.pricingTitle}</h2>
              <p className="text-sm text-muted">{dict.home.pricingIntro}</p>
            </div>
            <Link
              href={localePath(locale, "/pricing")}
              className="text-sm font-medium text-mint hover:underline shrink-0"
            >
              {dict.home.pricingCta} →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dict.pricing.plans.map((p) => (
              <div key={p.id} className="rounded-[16px] border border-line bg-surface p-5 space-y-3">
                <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold">US${p.price}</span>
                  <span className="text-xs text-muted">
                    {p.period === "once" ? dict.pricing.perOnce : dict.pricing.perMonth}
                  </span>
                </div>
                <p className="text-xs font-medium text-mint">
                  {p.attempts} {dict.pricing.attempts}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="border-t border-line py-16">
        <div className="container-page space-y-8">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-mint">
              {dict.home.faqEyebrow}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">{dict.home.faqTitle}</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {dict.home.faqs.map((f) => (
              <div key={f.q} className="rounded-[16px] border border-line bg-surface p-5 space-y-2">
                <h3 className="font-display text-base font-semibold">{f.q}</h3>
                <p className="text-xs leading-relaxed text-muted">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Final CTA */}
      <section className="border-t border-line py-16">
        <div className="container-page">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-[18px] border border-line bg-surface p-8">
            <div className="space-y-2 max-w-xl">
              <h2 className="font-display text-2xl sm:text-3xl font-bold">{dict.home.finalTitle}</h2>
              <p className="text-sm text-muted">{dict.home.finalText}</p>
            </div>
            <Link
              href={localePath(locale, "/dashboard/create")}
              className="inline-flex items-center gap-2 rounded-xl bg-mint px-5 py-3 text-sm font-semibold text-bg shrink-0"
            >
              <span>{dict.nav.cta}</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
