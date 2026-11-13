import { ModelCover } from "@/components/marketing/model-art";
import { coverFor } from "@/content/page-models";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { isLocale, localePath, LOCALES } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { en } from "@/i18n/dictionaries/en";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { innerPagesCopy } from "@/content/inner-pages";
import { MarketingShell } from "@/components/marketing-shell";
import { Pill, Section, SectionTitle, Tag } from "@/components/marketing-kit";

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
    title: `${article.title} | ${dict.meta.siteName}`,
    description: article.summary,
  });
}

/** Widths for up to three related guides, so they never sit as three equal boxes. */
const RELATED_SPANS = ["md:col-span-4", "md:col-span-2", "md:col-span-6"];

export default async function ResourceArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const article = dict.resources.articles.find((a) => a.slug === slug);
  if (!article) notFound();
  const user = await currentUser();
  const copy = innerPagesCopy[locale];

  const tagLabel = (tag: string) => dict.resources.tags[tag as keyof typeof dict.resources.tags];
  // Same kind of guide first, then the rest in their usual order.
  const others = dict.resources.articles.filter((a) => a.slug !== article.slug);
  const related = [...others.filter((a) => a.tag === article.tag), ...others.filter((a) => a.tag !== article.tag)].slice(0, 3);

  return (
    <MarketingShell tone="blue" locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <article>
        <header className="relative pb-10 pt-32 md:pt-40">
          <div className="container-page max-w-3xl space-y-5">
            <Link
              href={localePath(locale, "/resources")}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-fg"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {dict.resources.backToResources}
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <Pill>{tagLabel(article.tag)}</Pill>
              <Pill>{dict.resources.updated}</Pill>
            </div>
            <h1 className="hero-title text-[clamp(2rem,4.6vw,3.25rem)]">{article.title}</h1>
            <p className="text-lg leading-relaxed text-muted">{article.summary}</p>
          </div>
        </header>

        <div className="container-page max-w-3xl space-y-6 pb-6">
          <ModelCover model={coverFor(article.slug)} locale={locale} />
          <div className="card reveal space-y-9 p-7 md:p-10">
            {article.sections.map((s, i) => (
              <section key={s.h} className={`space-y-3.5 ${i > 0 ? "border-t border-line pt-9" : ""}`}>
                <h2 className="text-xl font-semibold leading-snug">{s.h}</h2>
                {s.p.map((para) => (
                  <p key={para} className="text-base leading-[1.8] text-fg/80">
                    {para}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <Section>
          <SectionTitle>{copy.resources.related}</SectionTitle>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-6">
            {related.map((a, i) => (
              <li key={a.slug} className={`flex ${RELATED_SPANS[i] ?? "md:col-span-2"}`}>
                <Link
                  href={localePath(locale, `/resources/${a.slug}`)}
                  className="card card-lift reveal group flex w-full flex-col justify-between gap-6 p-7 md:p-8"
                >
                  <div className="space-y-4">
                    <Tag>{tagLabel(a.tag)}</Tag>
                    <h3 className="text-lg font-semibold leading-tight transition-colors group-hover:text-accent group-focus-visible:text-accent">
                      {a.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted">{a.summary}</p>
                  </div>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-fg">
                    {dict.resources.read}
                    <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </MarketingShell>
  );
}
