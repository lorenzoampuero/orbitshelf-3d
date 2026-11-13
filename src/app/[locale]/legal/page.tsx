import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { LEGAL_SLUGS, legalDoc, legalIndexCopy, legalRoute } from "@/content/legal";
import { MarketingShell } from "@/components/marketing-shell";
import { PageHero, Section } from "@/components/marketing-kit";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const c = legalIndexCopy[locale];
  return buildPageMetadata({ locale, path: "/legal", title: c.metaTitle, description: c.metaDescription });
}

/** Mixed widths on a six-column grid so the documents never sit as one row of equal boxes. */
const SPANS = ["md:col-span-4", "md:col-span-2", "md:col-span-2", "md:col-span-2", "md:col-span-2", "md:col-span-3", "md:col-span-3", "md:col-span-2", "md:col-span-2", "md:col-span-2", "md:col-span-3", "md:col-span-3", "md:col-span-6"];

export default async function LegalIndexPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();
  const c = legalIndexCopy[locale];

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <PageHero calm pill={c.eyebrow} title={c.title} text={c.intro} />
      <Section>
        <p role="note" className="mb-6 max-w-3xl text-sm leading-relaxed text-muted">{c.draftNote}</p>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {LEGAL_SLUGS.map((slug, i) => {
            const doc = legalDoc(locale, slug);
            return (
              <li key={slug} className={`flex ${SPANS[i] ?? "md:col-span-2"}`}>
                <Link href={localePath(locale, legalRoute(slug))} className="card card-lift reveal group flex w-full flex-col justify-between gap-8 p-7 md:p-8">
                  <div className="space-y-3">
                    <h2 className="text-xl font-semibold leading-tight transition-colors group-hover:text-accent group-focus-visible:text-accent">{doc.title}</h2>
                    <p className="text-sm leading-relaxed text-muted">{doc.summary}</p>
                  </div>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-fg">
                    {c.read}
                    <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>
    </MarketingShell>
  );
}
