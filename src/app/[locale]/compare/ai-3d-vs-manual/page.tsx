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
      <section className="py-14 md:py-20">
        <div className="container-page space-y-10">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-mint">
              {dict.compare.eyebrow}
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">{dict.compare.title}</h1>
            <p className="text-base text-muted">{dict.compare.intro}</p>
          </div>

          <div className="overflow-x-auto rounded-[16px] border border-line bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-surface-2 text-xs uppercase text-muted">
                <tr>
                  {dict.compare.columns.map((c) => (
                    <th key={c} className="px-4 py-3 font-semibold">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {dict.compare.rows.map((r) => (
                  <tr key={r.topic}>
                    <th scope="row" className="px-4 py-3 font-medium text-fg">
                      {r.topic}
                    </th>
                    <td className="px-4 py-3 text-muted">{r.ai}</td>
                    <td className="px-4 py-3 text-muted">{r.manual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-[16px] border border-line bg-surface p-6 space-y-3">
              <h2 className="font-display text-lg font-semibold">{dict.compare.whenAiTitle}</h2>
              <ul className="list-disc pl-5 text-xs text-muted space-y-1.5">
                {dict.compare.whenAi.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-[16px] border border-line bg-surface p-6 space-y-3">
              <h2 className="font-display text-lg font-semibold">{dict.compare.whenManualTitle}</h2>
              <ul className="list-disc pl-5 text-xs text-muted space-y-1.5">
                {dict.compare.whenManual.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-[16px] border border-line bg-surface-2 p-6 space-y-2">
            <h2 className="font-display text-base font-semibold">{dict.compare.sourceTitle}</h2>
            <p className="text-xs leading-relaxed text-muted">{dict.compare.sourceText}</p>
            <a
              href="https://www.sloyd.ai/api/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs font-medium text-mint hover:underline"
            >
              {dict.compare.sourceLink} ↗
            </a>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
