import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, localePath } from "@/i18n/config";
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
    path: "/resources",
    title: dict.meta.resources.title,
    description: dict.meta.resources.description,
  });
}

export default async function ResourcesIndexPage({ params }: Props) {
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
              {dict.resources.eyebrow}
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">{dict.resources.title}</h1>
            <p className="text-base text-muted">{dict.resources.intro}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {dict.resources.articles.map((art) => (
              <Link
                key={art.slug}
                href={localePath(locale, `/resources/${art.slug}`)}
                className="flex flex-col justify-between rounded-[16px] border border-line bg-surface p-6 hover:border-mint transition-colors space-y-4"
              >
                <div className="space-y-2">
                  <span className="inline-block rounded bg-surface-2 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-mint">
                    {dict.resources.tags[art.tag as keyof typeof dict.resources.tags]}
                  </span>
                  <h2 className="font-display text-lg font-semibold text-fg">{art.title}</h2>
                  <p className="text-xs leading-relaxed text-muted">{art.summary}</p>
                </div>
                <span className="text-xs font-semibold text-mint">{dict.resources.read} →</span>
              </Link>
            ))}

            <Link
              href={localePath(locale, "/compare/ai-3d-vs-manual")}
              className="flex flex-col justify-between rounded-[16px] border border-line bg-surface p-6 hover:border-mint transition-colors space-y-4"
            >
              <div className="space-y-2">
                <span className="inline-block rounded bg-surface-2 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-violet">
                  {dict.resources.tags.comparison}
                </span>
                <h2 className="font-display text-lg font-semibold text-fg">
                  {dict.resources.compareCard.title}
                </h2>
                <p className="text-xs leading-relaxed text-muted">
                  {dict.resources.compareCard.summary}
                </p>
              </div>
              <span className="text-xs font-semibold text-mint">{dict.resources.read} →</span>
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
