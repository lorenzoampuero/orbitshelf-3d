import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { legalDoc, legalRoute } from "@/content/legal";
import { MarketingShell } from "@/components/marketing-shell";
import { LegalDocument } from "@/components/legal-document";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const doc = legalDoc(locale, "terms");
  return buildPageMetadata({ locale, path: legalRoute("terms"), title: doc.title, description: doc.summary });
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();
  const doc = legalDoc(locale, "terms");

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <section className="pb-20 pt-32 md:pb-28 md:pt-40">
        <LegalDocument dict={dict} locale={locale} title={doc.title} summary={doc.summary} sections={doc.sections} current="terms" />
      </section>
    </MarketingShell>
  );
}
