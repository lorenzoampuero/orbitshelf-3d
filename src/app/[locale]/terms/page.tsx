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
    path: "/terms",
    title: dict.meta.terms.title,
    description: dict.meta.terms.description,
  });
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <section className="py-14 md:py-20">
        <div className="container-page max-w-3xl space-y-8">
          <h1 className="font-display text-3xl font-bold">{dict.legal.terms.title}</h1>
          <div className="rounded-xl border border-line bg-surface-2 p-4 text-xs text-muted">
            {dict.legal.draft}
          </div>
          <div className="space-y-5">
            {dict.legal.terms.sections.map((s) => (
              <div key={s.h} className="rounded-[16px] border border-line bg-surface p-5 space-y-2">
                <h2 className="font-display text-lg font-semibold">{s.h}</h2>
                {s.p.map((p) => (
                  <p key={p} className="text-sm text-muted leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
