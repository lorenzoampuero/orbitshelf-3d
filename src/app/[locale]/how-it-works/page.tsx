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
    path: "/how-it-works",
    title: dict.meta.howItWorks.title,
    description: dict.meta.howItWorks.description,
  });
}

export default async function HowItWorksPage({ params }: Props) {
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
              {dict.how.eyebrow}
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">{dict.how.title}</h1>
            <p className="text-base text-muted">{dict.how.intro}</p>
          </div>

          <div className="space-y-4">
            {dict.how.sections.map((s) => (
              <article key={s.title} className="rounded-[16px] border border-line bg-surface p-6 space-y-3">
                <h2 className="font-display text-xl font-semibold">{s.title}</h2>
                <p className="text-sm text-muted leading-relaxed">{s.text}</p>
                <ul className="list-disc pl-5 text-xs text-muted space-y-1">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="rounded-[16px] border border-line bg-surface-2 p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold">{dict.how.limitsTitle}</h2>
            <ul className="list-disc pl-5 text-xs text-muted space-y-1.5">
              {dict.how.limits.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>

          <div>
            <Link
              href={localePath(locale, "/dashboard/create")}
              className="inline-flex items-center rounded-xl bg-mint px-5 py-3 text-sm font-semibold text-bg"
            >
              {dict.how.cta}
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
