import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { MarketingShell } from "@/components/marketing-shell";
import { Card, CardBody, Checklist, ClosingBanner, FaqList, PageHero, Section, SectionTitle, StatusBadge, Tag } from "@/components/marketing-kit";
import { Chips, FlowDiagram, SolutionsRow } from "@/components/features/feature-parts";
import { FEATURES_COMMON, FEATURES_INDEX, featureCopy } from "@/content/features";
import type { FeatureSlug } from "@/content/features";
import type { Locale } from "@/lib/types";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = FEATURES_INDEX[locale];
  return buildPageMetadata({
    locale,
    path: "/features",
    title: copy.meta.title,
    description: copy.meta.description,
  });
}

/** Order and size of the three mode cards: the multi-photo card is the wide one, text is the full-width strip. */
const COMPARE: { slug: FeatureSlug; span: string; row: boolean }[] = [
  { slug: "multi-image-to-3d", span: "md:col-span-4", row: false },
  { slug: "image-to-3d", span: "md:col-span-2", row: false },
  { slug: "text-to-3d", span: "md:col-span-6", row: true },
];

function CompareCard({ locale, slug, span, row }: { locale: Locale; slug: FeatureSlug; span: string; row: boolean }) {
  const c = featureCopy(locale, slug);
  const common = FEATURES_COMMON[locale];
  return (
    <Card lift className={`flex flex-col justify-between gap-8 md:p-9 ${span} ${row ? "md:flex-row md:items-center" : ""}`}>
      <div className="space-y-5">
        <Tag>{c.card.tag}</Tag>
        <h3 className="max-w-md text-2xl font-semibold leading-tight">{c.card.title}</h3>
        <p className="max-w-md text-sm leading-relaxed text-muted">{c.card.line}</p>
        <Checklist items={c.card.pickWhen} />
        <p className="text-sm text-muted">
          <span className="font-semibold text-fg">{common.needsLabel}: </span>
          {c.card.needs}
        </p>
        <Link href={localePath(locale, `/features/${slug}`)} className="btn-pill btn-outline max-w-full !whitespace-normal text-center">
          {common.seeMode.replace("{title}", c.hero.title)}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <FlowDiagram inputs={c.inOut.inputs} outputLabel={common.flowOutput} />
    </Card>
  );
}

export default async function FeaturesIndexPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();
  const idx = FEATURES_INDEX[locale];
  const common = FEATURES_COMMON[locale];
  const create = localePath(locale, "/dashboard/create");

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: idx.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* 1. Hero */}
      <PageHero
        pill={idx.hero.pill}
        title={idx.hero.title}
        text={idx.hero.text}
        primary={{ href: create, label: common.closingCta, testId: "features-cta-primary" }}
        secondary={{ href: localePath(locale, "/how-it-works"), label: common.embed.link }}
      />

      {/* 2. When to pick which */}
      <Section>
        <SectionTitle sub={idx.compareSub}>{idx.compareTitle}</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {COMPARE.map((m) => (
            <CompareCard key={m.slug} locale={locale} slug={m.slug} span={m.span} row={m.row} />
          ))}
        </div>
      </Section>

      {/* 3. The same steps after generating */}
      <Section>
        <SectionTitle sub={idx.afterSub}>{idx.afterTitle}</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <Card lift className="space-y-4 md:col-span-2">
            <Tag>{common.review.tag}</Tag>
            <h3 className="text-lg font-semibold leading-tight">{common.review.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{common.review.text}</p>
            <div aria-hidden="true" className="flex gap-1.5 pt-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className="flex h-7 w-7 items-center justify-center rounded-lg bg-blood text-white">
                  <Check className="h-4 w-4" />
                </span>
              ))}
            </div>
          </Card>

          <Card lift className="space-y-4 md:col-span-4 md:p-9">
            <Tag>{common.mesh.tag}</Tag>
            <h3 className="text-xl font-semibold leading-tight">{common.mesh.title}</h3>
            <p className="max-w-lg text-sm leading-relaxed text-muted">{common.mesh.text}</p>
            <Chips items={common.mesh.diagnostics} />
          </Card>

          <Card lift className="md:col-span-4 md:p-9">
            <CardBody tag={common.optimize.tag} title={common.optimize.title} text={common.optimize.text} />
          </Card>

          <Card lift className="space-y-4 md:col-span-2">
            <Tag>{common.exportCard.tag}</Tag>
            <h3 className="text-lg font-semibold leading-tight">{common.exportCard.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{common.exportCard.text}</p>
            <Chips items={["GLB", "OBJ", "STL"]} />
          </Card>

          <Card lift className="space-y-4 md:col-span-2">
            <CardBody tag={common.embed.tag} title={common.embed.title} text={common.embed.text} />
            <StatusBadge>{common.embed.badge}</StatusBadge>
          </Card>

          <Card className="flex flex-col justify-between gap-6 md:col-span-4 md:p-9">
            <div className="max-w-xl space-y-4">
              <Tag>{common.importCard.tag}</Tag>
              <h3 className="text-xl font-semibold leading-tight">{common.importCard.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{common.importCard.text}</p>
            </div>
            <Link href={create} className="btn-pill btn-outline self-start">
              {common.importCard.cta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Card>
        </div>
      </Section>

      {/* 4. Limits */}
      <Section>
        <SectionTitle>{idx.limitsTitle}</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <Card className="space-y-4 md:col-span-2">
            <Tag>{common.engine.tag}</Tag>
            <h3 className="text-xl font-semibold leading-tight">{common.engine.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{common.engine.text}</p>
            <StatusBadge tone="warn">{common.engine.badge}</StatusBadge>
          </Card>
          <Card className="md:col-span-4 md:p-9">
            <CardBody tag={idx.apparel.tag} title={idx.apparel.title} text={idx.apparel.text} />
          </Card>
        </div>
      </Section>

      {/* 5. FAQ */}
      <Section>
        <SectionTitle>{idx.faqTitle}</SectionTitle>
        <FaqList items={idx.faqs} />
      </Section>

      {/* 6. Trades and closing */}
      <Section className="!pt-0">
        <SectionTitle sub={common.solutionsSub}>{common.solutionsTitle}</SectionTitle>
        <SolutionsRow locale={locale} common={common} />
      </Section>

      <ClosingBanner titleA={idx.closing.titleA} titleB={idx.closing.titleB} cta={common.closingCta} href={create} note={common.closingNote} />
    </MarketingShell>
  );
}
