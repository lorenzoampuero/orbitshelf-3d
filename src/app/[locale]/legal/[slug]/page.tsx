import { notFound } from "next/navigation";
import { isLocale, LOCALES } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { isLegalSlug, LEGAL_SLUGS, legalDoc, legalRoute } from "@/content/legal";
import { MarketingShell } from "@/components/marketing-shell";
import { LegalDocument } from "@/components/legal-document";

type Props = { params: Promise<{ locale: string; slug: string }> };

/** Privacy and terms keep their own short routes, so they are not generated here. */
const OWN_ROUTE = new Set(["privacy", "terms"]);

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => LEGAL_SLUGS.filter((s) => !OWN_ROUTE.has(s)).map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isLegalSlug(slug) || OWN_ROUTE.has(slug)) return {};
  const doc = legalDoc(locale, slug);
  return buildPageMetadata({ locale, path: legalRoute(slug), title: doc.title, description: doc.summary });
}

export default async function LegalPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isLegalSlug(slug) || OWN_ROUTE.has(slug)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();
  const doc = legalDoc(locale, slug);

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <section className="pb-20 pt-32 md:pb-28 md:pt-40">
        <LegalDocument dict={dict} locale={locale} title={doc.title} summary={doc.summary} sections={doc.sections} current={slug} />
      </section>
    </MarketingShell>
  );
}
