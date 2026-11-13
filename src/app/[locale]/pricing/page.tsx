import { notFound } from "next/navigation";
import { Box, Check, ChevronRight, Coins, Image as ImageIcon, Minus, RefreshCw, Undo2 } from "lucide-react";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { PLAN_TIERS } from "@/lib/credits";
import { PRICING_EXTRA, TOP_UPS } from "@/content/pricing-extra";
import { MarketingShell } from "@/components/marketing-shell";
import { PlanCards } from "@/components/plan-cards";
import { Card, ClosingBanner, FaqList, PageHero, Pill, Section, SectionTitle, StatusBadge, Tile } from "@/components/marketing-kit";
import { ReadingSuggestions, TrustStrip, WorkflowVersus } from "@/components/landing-extra";
import { planReference } from "@/lib/provider/registry";
import { ModelRail, ModelSpotlight } from "@/components/marketing/model-art";
import { PAGE_MODELS, RAIL_COPY, pick, closingArt, SPOTLIGHT } from "@/content/page-models";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildPageMetadata({
    locale,
    path: "/pricing",
    title: PRICING_EXTRA[locale].meta.title,
    description: PRICING_EXTRA[locale].meta.description,
  });
}

/** A drawn step in a small flow: tile, then an arrow to the next one. */
function Flow({ steps, icons }: { steps: string[]; icons: React.ReactNode[] }) {
  return (
    <div className="flex flex-wrap items-start gap-x-3 gap-y-4">
      {steps.map((label, i) => (
        <div key={label} className="flex items-start gap-3">
          <Tile label={label} tone={i === 1 ? "accent-fill" : "dark"}>
            {icons[i]}
          </Tile>
          {i < steps.length - 1 ? <ChevronRight className="mt-4 h-5 w-5 shrink-0 text-muted" aria-hidden="true" /> : null}
        </div>
      ))}
    </div>
  );
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const x = PRICING_EXTRA[locale];
  const user = await currentUser();

  // es-CL groups thousands the same way on the server and in every browser.
  const count = (n: number) => n.toLocaleString(locale === "es" ? "es-CL" : "en-US");
  const range = (a: string, b: string) => `${a}${x.rangeJoin}${b}`;
  const usd = (n: number) => `US$${n}`;

  const priceCell = (id: string) => {
    const steps = PLAN_TIERS.find((t) => t.id === id)!.steps;
    const first = steps[0];
    const last = steps[steps.length - 1];
    return steps.length > 1 ? range(usd(first.priceUsd), usd(last.priceUsd)) : usd(first.priceUsd);
  };
  const creditsCell = (id: string) => {
    const steps = PLAN_TIERS.find((t) => t.id === id)!.steps;
    const first = steps[0];
    const last = steps[steps.length - 1];
    return steps.length > 1 ? range(count(first.credits), count(last.credits)) : count(first.credits);
  };

  // Planned rows come from the dictionary, so the table and the cards can never disagree.
  const plannedRows = Array.from(new Set(dict.pricing.plans.flatMap((p) => p.planned)));
  const plannedIn = (id: string, item: string) => dict.pricing.plans.find((p) => p.id === id)?.planned.includes(item) ?? false;

  const yes = (
    <>
      <Check className="mx-auto h-4 w-4 text-accent" aria-hidden="true" />
      <span className="sr-only">{x.table.included}</span>
    </>
  );
  const no = (label: string) => (
    <>
      <Minus className="mx-auto h-4 w-4 text-muted" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </>
  );

  return (
    <MarketingShell tone="violet" locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <PageHero marquee={9} pill={dict.pricing.eyebrow} title={dict.pricing.title} text={dict.pricing.intro} />

      <section className="relative pb-8 md:pb-12">
        <div className="glow -top-24 left-1/2 h-72 w-[min(44rem,100%)] -translate-x-1/2 opacity-40" aria-hidden="true" />
        <div className="container-page relative space-y-8">
          <h2 className="sr-only">{x.plansHeading}</h2>
          <PlanCards copy={dict.pricing} locale={locale} reference={planReference()} cta={{ href: localePath(locale, "/dashboard/create"), label: dict.pricing.cta }} />
          <div className="mx-auto max-w-2xl space-y-2 text-center text-sm leading-relaxed text-muted">
            <p>{dict.pricing.banner}</p>
            <p>{dict.pricing.disclaimer}</p>
          </div>
        </div>
      </section>

      <Section>
        <SectionTitle sub={x.credits.sub}>{x.credits.title}</SectionTitle>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-6">
          <Card className="md:col-span-4">
            <div className="flex h-full flex-col justify-between gap-8">
              <div className="space-y-4">
                <Pill>{x.credits.renew.pill}</Pill>
                <h3 className="text-xl font-semibold leading-tight">{x.credits.renew.title}</h3>
                <p className="max-w-md text-sm leading-relaxed text-muted">{x.credits.renew.text}</p>
              </div>
              <Flow steps={x.credits.renew.steps} icons={[<Coins key="c" className="h-6 w-6" />, <Box key="b" className="h-6 w-6" />, <RefreshCw key="r" className="h-6 w-6" />]} />
            </div>
          </Card>

          <Card className="md:col-span-2">
            <div className="flex h-full flex-col justify-between gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold leading-tight">{x.credits.refund.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{x.credits.refund.text}</p>
              </div>
              <Tile tone="accent-fill">
                <Undo2 className="h-6 w-6" />
              </Tile>
            </div>
          </Card>

          <Card className="md:col-span-2">
            <div className="flex h-full flex-col justify-between gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold leading-tight">{x.credits.quote.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{x.credits.quote.text}</p>
              </div>
              <Flow steps={x.credits.quote.steps} icons={[<ImageIcon key="i" className="h-6 w-6" />, <Coins key="c" className="h-6 w-6" />, <Box key="b" className="h-6 w-6" />]} />
            </div>
          </Card>

          <Card className="md:col-span-4">
            <div className="flex h-full flex-col justify-between gap-8">
              <div className="space-y-4">
                <Pill>{x.credits.topups.pill}</Pill>
                <h3 className="text-xl font-semibold leading-tight">{x.credits.topups.title}</h3>
                <p className="max-w-lg text-sm leading-relaxed text-muted">{x.credits.topups.text}</p>
              </div>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {TOP_UPS.map((t) => (
                  <li key={t.usd} className="flex items-baseline justify-between gap-2 rounded-2xl border border-line bg-surface-2 px-4 py-3 sm:block">
                    <span className="block text-lg font-semibold tabular-nums">{usd(t.usd)}</span>
                    <span className="block text-xs tabular-nums text-muted">
                      {count(t.credits)} {x.credits.topups.credits}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </Section>

      <Section>
        <SectionTitle sub={x.table.sub}>{x.table.title}</SectionTitle>
        <div className="card reveal overflow-hidden">
          <div className="overflow-x-auto" role="region" aria-label={x.table.title} tabIndex={0}>
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <caption className="sr-only">{x.table.caption}</caption>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="bg-surface px-5 py-4 text-xs font-medium text-muted md:sticky md:left-0 md:z-10">
                    {x.table.feature}
                  </th>
                  {PLAN_TIERS.map((tier) => (
                    <th key={tier.id} scope="col" className="px-4 py-4 text-center align-bottom">
                      <span className="block text-base font-semibold text-fg">{tier.name}</span>
                      <span className="block text-xs font-normal tabular-nums text-muted">
                        {x.from} {usd(tier.steps[0].priceUsd)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td colSpan={PLAN_TIERS.length + 1} className="bg-surface-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted">
                    {x.table.groupCredits}
                  </td>
                </tr>
                {[
                  { label: x.table.price, cell: priceCell },
                  { label: x.table.monthlyCredits, cell: creditsCell },
                ].map((row) => (
                  <tr key={row.label} className="border-t border-line">
                    <th scope="row" className="bg-surface px-5 py-3 font-normal text-fg md:sticky md:left-0 md:z-10">
                      {row.label}
                    </th>
                    {PLAN_TIERS.map((tier) => (
                      <td key={tier.id} className="px-4 py-3 text-center tabular-nums text-fg">
                        {row.cell(tier.id)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>

              <tbody>
                <tr>
                  <td colSpan={PLAN_TIERS.length + 1} className="bg-surface-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted">
                    {x.table.groupNow}
                  </td>
                </tr>
                {x.table.now.map((label) => (
                  <tr key={label} className="border-t border-line">
                    <th scope="row" className="bg-surface px-5 py-3 font-normal text-fg md:sticky md:left-0 md:z-10">
                      {label}
                    </th>
                    {PLAN_TIERS.map((tier) => (
                      <td key={tier.id} className="px-4 py-3 text-center">
                        {yes}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>

              <tbody>
                <tr>
                  <td colSpan={PLAN_TIERS.length + 1} className="bg-surface-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted">
                    {x.table.groupPlanned}
                  </td>
                </tr>
                {plannedRows.map((label) => (
                  <tr key={label} className="border-t border-line">
                    <th scope="row" className="bg-surface px-5 py-3 font-normal text-fg md:sticky md:left-0 md:z-10">
                      {label}
                    </th>
                    {PLAN_TIERS.map((tier) => (
                      <td key={tier.id} className="px-4 py-3 text-center">
                        {plannedIn(tier.id, label) ? <StatusBadge>{x.table.planned}</StatusBadge> : no(x.table.notPlanned)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">{x.table.note}</p>
      </Section>

      <Section>
        <ModelSpotlight model={SPOTLIGHT["pricing"]} locale={locale} flip />
      </Section>

      <Section>
        <SectionTitle sub={RAIL_COPY[locale].sub}>{RAIL_COPY[locale].title}</SectionTitle>
        <ModelRail models={[...PAGE_MODELS.pricing, pick("money-bag")]} locale={locale} label={RAIL_COPY[locale].label} />
      </Section>

      <Section>
        <SectionTitle>{x.faqTitle}</SectionTitle>
        <FaqList items={x.faq} />
      </Section>

      <WorkflowVersus locale={locale} />
      <TrustStrip locale={locale} />
      <ReadingSuggestions locale={locale} page="pricing" />
      <ClosingBanner art={closingArt(7)}
        titleA={x.closing.titleA}
        titleB={x.closing.titleB}
        cta={dict.pricing.cta}
        href={localePath(locale, "/dashboard/create")}
        note={x.closing.note}
      />
    </MarketingShell>
  );
}
