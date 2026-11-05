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
      <section className="py-14 md:py-24">
        <div className="container-page space-y-14">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">{dict.how.eyebrow}</span>
            <h1 className="font-display text-4xl font-bold leading-[1.02] md:text-6xl">{dict.how.title}</h1>
            <p className="text-lg leading-relaxed text-muted">{dict.how.intro}</p>
          </div>

          <ol className="border-b border-line">
            {dict.how.sections.map((s) => (
              <li key={s.title} className="grid grid-cols-1 gap-4 border-t border-line py-8 md:grid-cols-12 md:gap-10">
                <h2 className="font-display text-2xl font-bold md:col-span-4">{s.title}</h2>
                <div className="space-y-4 md:col-span-8">
                  <p className="text-base leading-relaxed text-muted">{s.text}</p>
                  <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted marker:text-accent">
                    {s.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-10">
            <h2 className="font-display text-2xl font-bold md:col-span-4">{dict.how.limitsTitle}</h2>
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted marker:text-accent md:col-span-8">
              {dict.how.limits.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>

          <div>
            <Link href={localePath(locale, "/dashboard/create")} className="btn-pill btn-solid">
              {dict.how.cta}
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
