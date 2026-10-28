import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, localePath, LOCALES } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { en } from "@/i18n/dictionaries/en";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { MarketingShell } from "@/components/marketing-shell";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    en.resources.articles.map((a) => ({ locale, slug: a.slug })),
  );
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  const article = dict.resources.articles.find((a) => a.slug === slug);
  if (!article) return {};
  return buildPageMetadata({
    locale,
    path: `/resources/${article.slug}`,
    title: `${article.title} — ${dict.meta.siteName}`,
    description: article.summary,
  });
}

export default async function ResourceArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const article = dict.resources.articles.find((a) => a.slug === slug);
  if (!article) notFound();
  const user = await currentUser();

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <article className="py-14 md:py-20">
        <div className="container-page max-w-3xl space-y-8">
          <div className="space-y-3">
            <Link
              href={localePath(locale, "/resources")}
              className="text-xs font-medium text-mint hover:underline"
            >
              ← {dict.resources.backToResources}
            </Link>
            <div className="flex items-center gap-2">
              <span className="rounded bg-surface-2 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-mint">
                {dict.resources.tags[article.tag as keyof typeof dict.resources.tags]}
              </span>
              <span className="text-xs text-muted">{dict.resources.updated}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">{article.title}</h1>
            <p className="text-base text-muted">{article.summary}</p>
          </div>

          <div className="space-y-6">
            {article.sections.map((s) => (
              <section key={s.h} className="rounded-[16px] border border-line bg-surface p-6 space-y-3">
                <h2 className="font-display text-lg font-semibold">{s.h}</h2>
                {s.p.map((para) => (
                  <p key={para} className="text-sm leading-relaxed text-muted">
                    {para}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </article>
    </MarketingShell>
  );
}
