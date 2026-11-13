import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Coins, GitCompare } from "lucide-react";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { MarketingShell } from "@/components/marketing-shell";
import { Card, Checklist, ClosingBanner, PageHero, Section, SectionTitle, Tag } from "@/components/marketing-kit";
import { ReadingSuggestions, TrustStrip } from "@/components/landing-extra";
import { IntegrationBadge, MiniFlow, SolutionIcon } from "@/components/solutions/solution-parts";
import { SOLUTION_SLUGS, getSolutionsCopy } from "@/content/solutions";
import { ModelPile, ModelTrio, ModelSpotlight } from "@/components/marketing/model-art";
import { SOLUTION_MODELS, closingArt, SPOTLIGHT } from "@/content/page-models";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = getSolutionsCopy(locale);
  return buildPageMetadata({
    locale,
    path: "/solutions",
    title: copy.index.meta.title,
    description: copy.index.meta.description,
  });
}

export default async function SolutionsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();
  const copy = getSolutionsCopy(locale);
  const idx = copy.index;
  const create = localePath(locale, "/dashboard/create");

  return (
    <MarketingShell tone="magenta" locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <PageHero marquee={5}
        pill={idx.pill}
        title={idx.title}
        text={idx.text}
        primary={{ href: create, label: copy.ui.primaryCta }}
        secondary={{ href: localePath(locale, "/how-it-works"), label: copy.ui.secondaryCta }}
        visual={<ModelPile models={SOLUTION_MODELS.index.pile} locale={locale} />}
      />

      {/* The three trades as large cards. */}
      <Section>
        <SectionTitle>{idx.cardsTitle}</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {SOLUTION_SLUGS.map((slug, i) => {
            const s = copy.solutions[slug];
            return (
              <Card key={slug} lift tone={i === 2 ? "outline" : "default"} className="group/tile flex flex-col justify-between gap-8 overflow-hidden !p-0">
                <ModelTrio models={SOLUTION_MODELS[slug].card} locale={locale} sizes="(min-width: 768px) 320px, 92vw" />
                <div className="space-y-5 px-7 md:px-8">
                  <div className="flex items-start justify-between gap-3">
                    <Tag>{s.name}</Tag>
                    <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-fg">
                      <SolutionIcon name={s.icon} className="h-5 w-5" />
                    </span>
                  </div>
                  <h3 className="max-w-md text-2xl font-semibold leading-tight">{s.card.line}</h3>
                  <p className="max-w-md text-sm leading-relaxed text-muted">{s.card.text}</p>
                  <Checklist items={s.card.points} />
                </div>
                <div className="flex flex-col gap-6 px-7 pb-7 md:px-8 md:pb-8">
                  <MiniFlow items={s.flow} />
                  <Link href={localePath(locale, `/solutions/${slug}`)} className="btn-pill btn-outline self-start md:shrink-0">
                    {s.card.cta}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* What every trade shares. */}
      <Section>
        <ModelSpotlight model={SPOTLIGHT["solutions"]} locale={locale} flip />
      </Section>

      <Section>
        <SectionTitle sub={idx.sharedSub}>{idx.sharedTitle}</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <Card lift tone="feature" className="flex flex-col justify-between gap-8 md:col-span-4">
            <div className="space-y-4">
              <Tag>{idx.shared.review.tag}</Tag>
              <h3 className="max-w-md text-2xl font-semibold leading-tight">{idx.shared.review.title}</h3>
              <p className="max-w-md text-sm leading-relaxed text-muted">{idx.shared.review.text}</p>
            </div>
            <div aria-hidden="true" className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((n) => (
                <span key={n} className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-fill text-white">
                  <Check className="h-4 w-4" />
                </span>
              ))}
            </div>
          </Card>

          <Card lift className="flex flex-col justify-between gap-8 md:col-span-2">
            <div className="space-y-4">
              <Tag>{idx.shared.versions.tag}</Tag>
              <h3 className="text-xl font-semibold leading-tight">{idx.shared.versions.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{idx.shared.versions.text}</p>
            </div>
            <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-fg">
              <GitCompare className="h-5 w-5" />
            </span>
          </Card>

          <Card lift className="flex flex-col justify-between gap-8 md:col-span-2">
            <div className="space-y-4">
              <Tag>{idx.shared.cost.tag}</Tag>
              <h3 className="text-xl font-semibold leading-tight">{idx.shared.cost.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{idx.shared.cost.text}</p>
            </div>
            <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-fg">
              <Coins className="h-5 w-5" />
            </span>
          </Card>

          <Card lift className="flex flex-col justify-between gap-6 md:col-span-4">
            <div className="space-y-4">
              <Tag>{idx.shared.integrations.tag}</Tag>
              <h3 className="max-w-md text-2xl font-semibold leading-tight">{idx.shared.integrations.title}</h3>
              <p className="max-w-md text-sm leading-relaxed text-muted">{idx.shared.integrations.text}</p>
            </div>
            <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {copy.firstSix.map((id, n) => {
                const it = copy.integrations[id];
                return (
                  <li key={id} className="flex items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3">
                    <span className="flex items-center gap-3 text-sm font-medium text-fg">
                      <span aria-hidden="true" className="text-xs tabular-nums text-accent">{`0${n + 1}`}</span>
                      {it.name}
                    </span>
                    <IntegrationBadge status={it.status} labels={copy.statusLabels} />
                  </li>
                );
              })}
            </ol>
            <Link href={localePath(locale, "/integrations")} className="btn-pill btn-outline self-start">
              {idx.shared.integrations.cta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Card>
        </div>
      </Section>

      <TrustStrip locale={locale} />
      <ReadingSuggestions locale={locale} page="solutions" />
      <ClosingBanner art={closingArt(1)} titleA={idx.closing.titleA} titleB={idx.closing.titleB} cta={idx.closing.cta} href={create} note={idx.closing.note} />
    </MarketingShell>
  );
}
