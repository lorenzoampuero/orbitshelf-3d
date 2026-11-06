import { notFound } from "next/navigation";
import { Activity, ArrowRight, ClipboardCheck, Coins, Download, ImagePlus, TriangleAlert } from "lucide-react";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { innerPagesCopy, plainTitle } from "@/content/inner-pages";
import { MarketingShell } from "@/components/marketing-shell";
import { Checklist, ClosingBanner, PageHero, Section } from "@/components/marketing-kit";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return buildPageMetadata({
    locale,
    path: "/how-it-works",
    title: plainTitle(dict.meta.howItWorks.title),
    description: dict.meta.howItWorks.description,
  });
}

/** One icon and one grid span per step: input, cost, status, review, export. Mixed sizes on purpose. */
const STEP_ICONS = [ImagePlus, Coins, Activity, ClipboardCheck, Download];
const STEP_SPANS = ["md:col-span-4", "md:col-span-2", "md:col-span-2", "md:col-span-4", "md:col-span-3"];

export default async function HowItWorksPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();
  const copy = innerPagesCopy[locale];
  const create = localePath(locale, "/dashboard/create");

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <PageHero
        pill={dict.how.eyebrow}
        title={dict.how.title}
        text={dict.how.intro}
        primary={{ href: create, label: dict.how.cta }}
        visual={
          <div
            aria-hidden="true"
            className="card mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2 p-4 sm:gap-4 sm:p-7"
          >
            {STEP_ICONS.map((Icon, i) => (
              <span key={i} className="flex items-center gap-2 sm:gap-4">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl sm:h-14 sm:w-14 ${i === STEP_ICONS.length - 1 ? "bg-blood text-white" : "border border-line bg-surface-2 text-fg"}`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                {i < STEP_ICONS.length - 1 ? <ArrowRight className="hidden h-4 w-4 text-accent sm:block" /> : null}
              </span>
            ))}
          </div>
        }
      />

      <Section>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {dict.how.sections.map((s, i) => {
            const Icon = STEP_ICONS[i] ?? ImagePlus;
            return (
              <article key={s.title} className={`card reveal flex flex-col gap-6 p-7 md:p-8 ${STEP_SPANS[i] ?? "md:col-span-3"}`}>
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blood text-sm font-semibold tabular-nums text-white">
                    {i + 1}
                  </span>
                  <span aria-hidden="true" className="mesh-lines flex h-14 w-20 items-center justify-center rounded-xl bg-[#1b0b0c]">
                    <Icon className="h-6 w-6 text-accent" />
                  </span>
                </div>
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold leading-tight">{s.title.replace(/^\d+\.\s*/, "")}</h2>
                  <p className="text-sm leading-relaxed text-muted">{s.text}</p>
                </div>
                <Checklist items={s.bullets} />
              </article>
            );
          })}

          <article className="card reveal flex flex-col gap-5 p-7 md:col-span-3 md:p-8">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-warn">
                <TriangleAlert className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-semibold leading-tight">{dict.how.limitsTitle}</h2>
            </div>
            <ul className="space-y-2.5 text-sm leading-relaxed text-muted">
              {dict.how.limits.map((l) => (
                <li key={l} className="flex items-start gap-2.5">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
                  {l}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </Section>

      <ClosingBanner
        titleA={copy.how.closing.titleA}
        titleB={copy.how.closing.titleB}
        cta={dict.how.cta}
        href={create}
        note={dict.home.finalNote}
      />
    </MarketingShell>
  );
}
