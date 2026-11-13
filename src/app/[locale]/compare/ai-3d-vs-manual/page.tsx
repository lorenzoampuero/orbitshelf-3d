import { notFound } from "next/navigation";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { innerPagesCopy, plainTitle } from "@/content/inner-pages";
import { MarketingShell } from "@/components/marketing-shell";
import { Card, Checklist, ClosingBanner, PageHero, Section } from "@/components/marketing-kit";
import { ModelPile, ModelSpotlight } from "@/components/marketing/model-art";
import { PAGE_MODELS, closingArt, SPOTLIGHT } from "@/content/page-models";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return buildPageMetadata({
    locale,
    path: "/compare/ai-3d-vs-manual",
    title: plainTitle(dict.meta.compare.title),
    description: dict.meta.compare.description,
  });
}

export default async function ComparePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();
  const copy = innerPagesCopy[locale];
  const c = dict.compare;

  return (
    <MarketingShell tone="amber" locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <PageHero marquee={8} pill={c.eyebrow} title={c.title} text={c.intro} visual={<ModelPile models={PAGE_MODELS.compare} locale={locale} />} />

      <Section>
        <ModelSpotlight model={SPOTLIGHT["compare"]} locale={locale} flip />
      </Section>

      <Section>
        <div className="card reveal overflow-hidden">
          <div className="overflow-x-auto" role="region" aria-label={c.title} tabIndex={0}>
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-xs uppercase tracking-wider text-muted">
                  {c.columns.map((col, i) => (
                    <th key={col} scope="col" className={`px-5 py-4 font-semibold md:px-6 ${i === 1 ? "text-fg" : ""}`}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.rows.map((r) => (
                  <tr key={r.topic} className="odd:bg-white/[0.03]">
                    <th scope="row" className="w-[22%] px-5 py-4 align-top font-semibold text-fg md:px-6">
                      {r.topic}
                    </th>
                    <td className="px-5 py-4 align-top leading-relaxed text-muted md:px-6">{r.ai}</td>
                    <td className="px-5 py-4 align-top leading-relaxed text-muted md:px-6">{r.manual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <Card className="md:col-span-3">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold leading-tight">{c.whenAiTitle}</h2>
              <Checklist items={c.whenAi} />
            </div>
          </Card>
          <Card className="md:col-span-3">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold leading-tight">{c.whenManualTitle}</h2>
              <Checklist items={c.whenManual} />
            </div>
          </Card>
        </div>
      </Section>

      <ClosingBanner art={closingArt(5)}
        titleA={copy.compare.closing.titleA}
        titleB={copy.compare.closing.titleB}
        cta={dict.how.cta}
        href={localePath(locale, "/dashboard/create")}
        note={dict.home.finalNote}
      />
    </MarketingShell>
  );
}
