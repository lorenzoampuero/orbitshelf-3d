import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { isLocale, localePath, LOCALES } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { MarketingShell } from "@/components/marketing-shell";
import { ModelViewerBox } from "@/components/model-viewer-box";
import { Card, CardBody, ClosingBanner, FaqList, PageHero, Section, SectionTitle, StatusBadge, Tag } from "@/components/marketing-kit";
import { AsideCard, Chips, FlowDiagram, ModeLinkCard, SolutionsRow, TIP_SPANS, TipCard, demoKind } from "@/components/features/feature-parts";
import { FEATURES_COMMON, FEATURE_SLUGS, featureCopy, isFeatureSlug } from "@/content/features";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => FEATURE_SLUGS.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isFeatureSlug(slug)) return {};
  const copy = featureCopy(locale, slug);
  return buildPageMetadata({
    locale,
    path: `/features/${slug}`,
    title: copy.meta.title,
    description: copy.meta.description,
  });
}

export default async function FeatureModePage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isFeatureSlug(slug)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();
  const c = featureCopy(locale, slug);
  const common = FEATURES_COMMON[locale];
  const create = localePath(locale, "/dashboard/create");
  const others = FEATURE_SLUGS.filter((s) => s !== slug);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const viewerLabels = {
    resetLabel: dict.dash.detail.resetView,
    autoRotateLabel: dict.dash.detail.autoRotate,
    autoRotateOffLabel: dict.dash.detail.autoRotateOff,
    loadingLabel: dict.dash.detail.viewerLoading,
    errorLabel: dict.dash.detail.viewerError,
  };

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* 1. Hero */}
      <PageHero
        pill={c.hero.pill}
        title={c.hero.title}
        text={c.hero.text}
        primary={{ href: create, label: common.closingCta, testId: "feature-cta-primary" }}
        secondary={{ href: localePath(locale, "/examples"), label: common.heroSecondary }}
      />

      {/* 2. What goes in, what comes out */}
      <Section>
        <SectionTitle>{common.inOutTitle}</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <Card lift className="flex flex-col justify-between gap-10 md:col-span-4 md:p-9">
            <div className="space-y-4">
              <Tag>{c.inOut.tag}</Tag>
              <h3 className="max-w-md text-2xl font-semibold leading-tight">{c.inOut.title}</h3>
              <p className="max-w-md text-sm leading-relaxed text-muted">{c.inOut.text}</p>
            </div>
            <FlowDiagram inputs={c.inOut.inputs} outputLabel={common.flowOutput} kind={demoKind(c.viewer.src)} />
          </Card>

          <Card className="space-y-5 md:col-span-2">
            <Tag>{common.flowGet}</Tag>
            <ul className="space-y-3 text-sm leading-relaxed text-muted">
              {c.inOut.gets.map((g) => (
                <li key={g} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  {g}
                </li>
              ))}
            </ul>
          </Card>

          {c.inOut.facts.map((f, i) => (
            <Card key={f.tag} lift className={i === 0 ? "md:col-span-2" : "md:col-span-4"}>
              <CardBody tag={f.tag} title={f.title} text={f.text} />
            </Card>
          ))}
        </div>
      </Section>

      {/* 3. How to get a good result */}
      <Section>
        <SectionTitle sub={common.tipsSub}>{common.tipsTitle}</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <AsideCard aside={c.aside} />
          {c.tips.map((tip, i) => (
            <TipCard key={tip.title} tip={tip} span={TIP_SPANS[i % TIP_SPANS.length]} />
          ))}
        </div>
      </Section>

      {/* 4. What you can do after generating */}
      <Section>
        <SectionTitle sub={common.afterSub}>{common.afterTitle}</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <Card tone="red" className="grid grid-cols-1 gap-6 overflow-hidden md:col-span-6 md:grid-cols-2 md:p-9">
            <div className="flex flex-col items-start justify-center space-y-4">
              <Tag>{common.mesh.tag}</Tag>
              <h3 className="text-2xl font-semibold leading-tight">{common.mesh.title}</h3>
              <p className="max-w-sm text-sm leading-relaxed text-muted">{common.mesh.text}</p>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-fg">{common.mesh.diagnosticsLabel}</p>
                <Chips items={common.mesh.diagnostics} />
              </div>
              <p className="text-xs text-muted">{common.mesh.sample}</p>
            </div>
            <ModelViewerBox
              src={c.viewer.src}
              alt={c.viewer.alt}
              heightClass="h-[300px] md:h-[360px]"
              provenanceBadge={common.mesh.badge}
              testId="feature-mesh-viewer"
              wheelZoom={false}
              wireframeLabel={dict.dash.detail.wireframe}
              surfaceLabel={dict.dash.detail.surface}
              {...viewerLabels}
            />
          </Card>

          <Card lift tone="outline" className="space-y-4 md:col-span-4 md:p-9">
            <Tag>{common.review.tag}</Tag>
            <h3 className="text-xl font-semibold leading-tight">{common.review.title}</h3>
            <p className="max-w-lg text-sm leading-relaxed text-muted">{c.reviewText}</p>
            <div aria-hidden="true" className="flex gap-1.5 pt-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className="flex h-7 w-7 items-center justify-center rounded-lg bg-blood text-white">
                  <Check className="h-4 w-4" />
                </span>
              ))}
            </div>
          </Card>

          <Card lift className="md:col-span-2">
            <CardBody tag={common.optimize.tag} title={common.optimize.title} text={common.optimize.text} />
          </Card>

          <Card lift className="space-y-4 md:col-span-2">
            <Tag>{common.exportCard.tag}</Tag>
            <h3 className="text-xl font-semibold leading-tight">{common.exportCard.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{common.exportCard.text}</p>
            <Chips items={["GLB", "OBJ", "STL"]} />
          </Card>

          <Card tone="outline" className="flex flex-col justify-between gap-6 md:col-span-4 md:p-9">
            <div className="flex max-w-xl flex-col items-start space-y-4">
              <Tag>{common.embed.tag}</Tag>
              <h3 className="text-xl font-semibold leading-tight">{common.embed.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{common.embed.text}</p>
              <StatusBadge>{common.embed.badge}</StatusBadge>
            </div>
            <Link href={localePath(locale, "/how-it-works")} className="btn-pill btn-outline self-start">
              {common.embed.link}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Card>
        </div>
      </Section>

      {/* 5. Honest limits */}
      <Section>
        <SectionTitle sub={common.limitsSub}>{common.limitsTitle}</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <Card tone="outline" className="md:col-span-4 md:p-9">
            <ul className="space-y-5">
              {c.limits.map((l) => (
                <li key={l.title} className="space-y-1">
                  <h3 className="text-base font-semibold leading-snug">{l.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{l.text}</p>
                </li>
              ))}
            </ul>
          </Card>
          <Card tone="planned" className="space-y-4 self-start md:col-span-2">
            <Tag>{common.engine.tag}</Tag>
            <h3 className="text-xl font-semibold leading-tight">{common.engine.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{common.engine.text}</p>
            <StatusBadge tone="warn">{common.engine.badge}</StatusBadge>
          </Card>
        </div>
      </Section>

      {/* 6. FAQ */}
      <Section>
        <SectionTitle>{common.faqTitle}</SectionTitle>
        <FaqList items={c.faqs} />
      </Section>

      {/* 7. Other modes, then the trades. */}
      <Section>
        <SectionTitle>{common.othersTitle}</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {others.map((other, i) => {
            const oc = featureCopy(locale, other);
            return (
              <ModeLinkCard
                key={other}
                locale={locale}
                slug={other}
                copy={oc}
                common={common}
                title={oc.hero.title}
                className={i === 0 ? "md:col-span-3" : "md:col-span-2"}
              />
            );
          })}
        </div>
      </Section>

      <Section className="!pt-0">
        <SectionTitle sub={common.solutionsSub}>{common.solutionsTitle}</SectionTitle>
        <SolutionsRow locale={locale} common={common} />
      </Section>

      {/* 8. Closing banner */}
      <ClosingBanner titleA={c.closing.titleA} titleB={c.closing.titleB} cta={common.closingCta} href={create} note={common.closingNote} />
    </MarketingShell>
  );
}
