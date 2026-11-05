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

  const items = [
    ...dict.resources.articles.map((a) => ({
      key: a.slug,
      href: `/resources/${a.slug}`,
      tag: dict.resources.tags[a.tag as keyof typeof dict.resources.tags],
      title: a.title,
      summary: a.summary,
    })),
    {
      key: "compare",
      href: "/compare/ai-3d-vs-manual",
      tag: dict.resources.tags.comparison,
      title: dict.resources.compareCard.title,
      summary: dict.resources.compareCard.summary,
    },
  ];

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <section className="py-14 md:py-24">
        <div className="container-page space-y-14">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">{dict.resources.eyebrow}</span>
            <h1 className="font-display text-4xl font-bold leading-[1.02] md:text-6xl">{dict.resources.title}</h1>
            <p className="text-lg leading-relaxed text-muted">{dict.resources.intro}</p>
          </div>

          <ul className="border-b border-line">
            {items.map((it) => (
              <li key={it.key} className="border-t border-line">
                <Link
                  href={localePath(locale, it.href)}
                  className="group grid grid-cols-1 gap-2 py-6 md:grid-cols-12 md:items-baseline md:gap-8"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent md:col-span-2">{it.tag}</span>
                  <span className="font-display text-xl font-bold transition-colors group-hover:text-accent group-focus-visible:text-accent md:col-span-5 md:text-2xl">
                    {it.title}
                  </span>
                  <span className="text-sm leading-relaxed text-muted md:col-span-5">{it.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </MarketingShell>
  );
}
