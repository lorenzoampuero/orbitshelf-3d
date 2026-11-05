import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { MarketingShell } from "@/components/marketing-shell";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return buildPageMetadata({
    locale,
    path: "/compare/ai-3d-vs-manual",
    title: dict.meta.compare.title,
    description: dict.meta.compare.description,
  });
}

export default async function ComparePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <section className="py-14 md:py-24">
        <div className="container-page space-y-14">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">{dict.compare.eyebrow}</span>
            <h1 className="font-display text-4xl font-bold leading-[1.02] md:text-6xl">{dict.compare.title}</h1>
            <p className="text-lg leading-relaxed text-muted">{dict.compare.intro}</p>
          </div>

          <div className="overflow-x-auto" role="region" aria-label={dict.compare.title} tabIndex={0}>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-fg/30 text-xs uppercase tracking-wider text-muted">
                <tr>
                  {dict.compare.columns.map((c) => (
                    <th key={c} scope="col" className="px-4 py-3 font-semibold first:pl-0">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line border-b border-line">
                {dict.compare.rows.map((r) => (
                  <tr key={r.topic}>
                    <th scope="row" className="px-4 py-4 align-top font-semibold text-fg first:pl-0">
                      {r.topic}
                    </th>
                    <td className="px-4 py-4 align-top leading-relaxed text-muted">{r.ai}</td>
                    <td className="px-4 py-4 align-top leading-relaxed text-muted">{r.manual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12">
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-bold">{dict.compare.whenAiTitle}</h2>
              <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted marker:text-accent">
                {dict.compare.whenAi.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-bold">{dict.compare.whenManualTitle}</h2>
              <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted marker:text-accent">
                {dict.compare.whenManual.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-2 border-t border-line pt-8">
            <h2 className="font-display text-lg font-bold">{dict.compare.sourceTitle}</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted">{dict.compare.sourceText}</p>
            <a
              href="https://www.sloyd.ai/api/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-semibold text-fg underline underline-offset-4 hover:text-accent"
            >
              {dict.compare.sourceLink} ↗
            </a>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
