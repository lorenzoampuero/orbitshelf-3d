import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { MarketingShell } from "@/components/marketing-shell";
import { plainTitle } from "@/content/inner-pages";
import { PageHero, Section, Tag } from "@/components/marketing-kit";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return buildPageMetadata({
    locale,
    path: "/resources",
    title: plainTitle(dict.meta.resources.title),
    description: dict.meta.resources.description,
  });
}

/** Mixed card widths on a six-column grid, by position. The comparison card closes the page at full width. */
const SPANS = ["md:col-span-4", "md:col-span-2", "md:col-span-2", "md:col-span-2", "md:col-span-2", "md:col-span-3", "md:col-span-3"];

export default async function ResourcesIndexPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();

  const items = [
    ...dict.resources.articles.map((a, i) => ({
      key: a.slug,
      href: `/resources/${a.slug}`,
      tag: dict.resources.tags[a.tag as keyof typeof dict.resources.tags],
      title: a.title,
      summary: a.summary,
      span: SPANS[i] ?? "md:col-span-2",
    })),
    {
      key: "compare",
      href: "/compare/ai-3d-vs-manual",
      tag: dict.resources.tags.comparison,
      title: dict.resources.compareCard.title,
      summary: dict.resources.compareCard.summary,
      span: "md:col-span-6",
    },
  ];

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <PageHero pill={dict.resources.eyebrow} title={dict.resources.title} text={dict.resources.intro} />

      <Section>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {items.map((it, i) => (
            <li key={it.key} className={`flex ${it.span}`}>
              <Link
                href={localePath(locale, it.href)}
                className={`card card-lift reveal group flex w-full flex-col justify-between gap-8 p-7 md:p-8 ${i === 0 ? "md:min-h-[260px]" : ""}`}
              >
                <div className="space-y-4">
                  <Tag>{it.tag}</Tag>
                  <h2 className={`font-semibold leading-tight transition-colors group-hover:text-accent group-focus-visible:text-accent ${i === 0 ? "text-2xl md:max-w-md" : "text-xl"}`}>
                    {it.title}
                  </h2>
                  <p className="max-w-xl text-sm leading-relaxed text-muted">{it.summary}</p>
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
    </MarketingShell>
  );
}
