import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { innerPagesCopy, plainTitle } from "@/content/inner-pages";
import { MarketingShell } from "@/components/marketing-shell";
import { Card, Checklist, ClosingBanner, PageHero, Section } from "@/components/marketing-kit";

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
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <PageHero pill={c.eyebrow} title={c.title} text={c.intro} />

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

          <article className="card reveal flex flex-col justify-between gap-6 p-7 md:col-span-6 md:flex-row md:items-end md:p-8">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-lg font-semibold leading-tight">{c.sourceTitle}</h2>
              <p className="text-sm leading-relaxed text-muted">{c.sourceText}</p>
            </div>
            <a
              href="https://www.sloyd.ai/api/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 self-start text-sm font-semibold text-fg underline underline-offset-4 hover:text-accent md:self-auto"
            >
              {c.sourceLink}
              <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </a>
          </article>
        </div>
      </Section>

      <ClosingBanner
        titleA={copy.compare.closing.titleA}
        titleB={copy.compare.closing.titleB}
        cta={dict.how.cta}
        href={localePath(locale, "/dashboard/create")}
        note={dict.home.finalNote}
      />
    </MarketingShell>
  );
}
