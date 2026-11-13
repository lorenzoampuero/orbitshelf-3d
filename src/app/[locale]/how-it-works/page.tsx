import { notFound } from "next/navigation";
import { Activity, ClipboardCheck, Coins, Download, ImagePlus, TriangleAlert } from "lucide-react";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { innerPagesCopy, plainTitle } from "@/content/inner-pages";
import { MarketingShell } from "@/components/marketing-shell";
import { Checklist, ClosingBanner, PageHero, Section, SectionTitle } from "@/components/marketing-kit";
import { ReadingSuggestions, TrustStrip, WorkflowVersus } from "@/components/landing-extra";
import { ModelPile, ModelSpotlight } from "@/components/marketing/model-art";
import { BuildSequence } from "@/components/marketing/build-sequence";
import { PAGE_MODELS, pick, closingArt, SPOTLIGHT } from "@/content/page-models";
import { art, artCopy } from "@/content/landing-art";
import { homeCopy } from "@/content/home-copy";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return buildPageMetadata({
    locale,
    path: "/how-it-works",
    title: plainTitle(dict.meta.howItWorks.title),
    description: dict.meta.howItWorks.description,
  });
}

/** One icon and one grid span per step: input, cost, status, review, export. Mixed sizes on purpose. */
const STEP_ICONS = [ImagePlus, Coins, Activity, ClipboardCheck, Download];
const STEP_SPANS = ["md:col-span-4", "md:col-span-2", "md:col-span-2", "md:col-span-4", "md:col-span-3"];

export default async function HowItWorksPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();
  const copy = innerPagesCopy[locale];
  const create = localePath(locale, "/dashboard/create");
  const seq = homeCopy[locale].sequence;
  const kitchen = pick("kitchen-units");
  const big = (n: number) => (n >= 9.5e5 ? `${(n / 1e6).toFixed(1)}M` : `${Math.round(n / 1e3)}K`);

  return (
    <MarketingShell tone="cyan" locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <PageHero marquee={6}
        pill={dict.how.eyebrow}
        title={dict.how.title}
        text={dict.how.intro}
        primary={{ href: create, label: dict.how.cta }}
        visual={<ModelPile models={PAGE_MODELS.howItWorks} locale={locale} />}
      />

      {/* One model told in six steps while the page scrolls. */}
      <Section>
        <SectionTitle sub={seq.sub}>{seq.title}</SectionTitle>
        <BuildSequence
          copy={seq}
          layers={{ wire: art.kitchen.wire, clay: art.kitchen.clay, beauty: art.kitchen.beauty }}
          alt={artCopy[locale].alts.kitchen}
          figures={{ original: big(kitchen.tris.original), web: big(kitchen.tris.web), size: `${(kitchen.bytes.web / (1024 * 1024)).toFixed(1)} MB` }}
        />
      </Section>

      <Section>
        <ModelSpotlight model={SPOTLIGHT["howItWorks"]} locale={locale} flip />
      </Section>

      <Section>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {dict.how.sections.map((s, i) => {
            const Icon = STEP_ICONS[i] ?? ImagePlus;
            return (
              <article key={s.title} className={`card reveal flex flex-col gap-6 p-7 md:p-8 ${STEP_SPANS[i] ?? "md:col-span-3"}`}>
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-fill text-sm font-semibold tabular-nums text-white">
                    {i + 1}
                  </span>
                  <span aria-hidden="true" className="mesh-lines flex h-14 w-20 items-center justify-center rounded-xl bg-surface-deep">
                    <Icon className="h-6 w-6 text-accent" />
                  </span>
                </div>
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold leading-tight">{s.title.replace(/^\d+\.\s*/, "")}</h2>
                  <p className="text-sm leading-relaxed text-muted">{s.text}</p>
                </div>
                <Checklist items={s.bullets} />
              </article>
            );
          })}

          <article className="card reveal flex flex-col gap-5 p-7 md:col-span-3 md:p-8">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-warn">
                <TriangleAlert className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-semibold leading-tight">{dict.how.limitsTitle}</h2>
            </div>
            <ul className="space-y-2.5 text-sm leading-relaxed text-muted">
              {dict.how.limits.map((l) => (
                <li key={l} className="flex items-start gap-2.5">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
                  {l}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </Section>

      <WorkflowVersus locale={locale} />
      <TrustStrip locale={locale} />
      <ReadingSuggestions locale={locale} page="howItWorks" />
      <ClosingBanner art={closingArt(4)}
        titleA={copy.how.closing.titleA}
        titleB={copy.how.closing.titleB}
        cta={dict.how.cta}
        href={create}
        note={dict.home.finalNote}
      />
    </MarketingShell>
  );
}
