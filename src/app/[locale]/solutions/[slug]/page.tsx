import { notFound } from "next/navigation";
import { isLocale, localePath, LOCALES } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { MarketingShell } from "@/components/marketing-shell";
import { ModelViewerBox } from "@/components/model-viewer-box";
import { ClosingBanner, FaqList, PageHero, Section, SectionTitle } from "@/components/marketing-kit";
import { ExpectBlock, FeatureBento, HeroFlow, IntegrationsBlock, Workflow } from "@/components/solutions/solution-parts";
import { SOLUTION_SLUGS, getSolution, getSolutionsCopy, isSolutionSlug, type SolutionSlug } from "@/content/solutions";
import { showcaseFor } from "@/config/showcase";
import { ModelPile, ModelRail, ModelSpotlight } from "@/components/marketing/model-art";
import { RAIL_COPY, SOLUTION_MODELS, closingArt, SPOTLIGHT } from "@/content/page-models";
import type { Tone } from "@/content/tones";

const SOLUTION_TONE: Record<string, { tone: Tone; seed: number; art: number }> = {
  stores: { tone: "amber", seed: 13, art: 6 },
  games: { tone: "emerald", seed: 14, art: 3 },
  design: { tone: "cyan", seed: 15, art: 4 },
};

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => SOLUTION_SLUGS.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isSolutionSlug(slug)) return {};
  const s = getSolution(locale, slug);
  return buildPageMetadata({
    locale,
    path: `/solutions/${slug}`,
    title: s.meta.title,
    description: s.meta.description,
  });
}

/** Demo sample per trade, always labelled as a demo. Stores swap it for a real approved result when one exists. */
const DEMO_MODEL: Record<SolutionSlug, string> = {
  stores: "/demo/vase.glb",
  games: "/demo/chair.glb",
  design: "/demo/lamp.glb",
};

/** Mesh toggle is part of the story for games and design, not for stores. */
const SHOWS_MESH: Record<SolutionSlug, boolean> = { stores: false, games: true, design: true };

export default async function SolutionPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isSolutionSlug(slug)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();
  const copy = getSolutionsCopy(locale);
  const s = getSolution(locale, slug);
  const create = localePath(locale, "/dashboard/create");
  const sm = SOLUTION_MODELS[slug];
  const rail = RAIL_COPY[locale];

  // A real result only when one exists (config/showcase.ts is empty today).
  const real =
    slug === "stores"
      ? (["apparel", "furniture", "footwear", "home-decor"] as const).map((c) => showcaseFor(c)).find((e) => e !== null) ?? null
      : null;

  const viewerLabels = {
    resetLabel: dict.dash.detail.resetView,
    autoRotateLabel: dict.dash.detail.autoRotate,
    autoRotateOffLabel: dict.dash.detail.autoRotateOff,
    loadingLabel: dict.dash.detail.viewerLoading,
    errorLabel: dict.dash.detail.viewerError,
  };
  const meshLabels = SHOWS_MESH[slug]
    ? { wireframeLabel: dict.dash.detail.wireframe, surfaceLabel: dict.dash.detail.surface }
    : {};

  const caption = real
    ? real.kind === "text"
      ? copy.ui.generatedText
      : copy.ui.generatedPhotos.replace("{n}", String(real.photos.length))
    : copy.ui.demoCaption;

  const viewer = (
    <>
      <ModelViewerBox
        src={real ? real.glb : DEMO_MODEL[slug]}
        alt={real ? real.alt[locale] : s.viewerAlt}
        heightClass="h-[280px] md:h-[320px]"
        testId={`solution-${slug}-viewer`}
        wheelZoom={false}
        {...meshLabels}
        {...viewerLabels}
      />
      <p className="text-xs text-muted">{caption}</p>
    </>
  );

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: s.faq.items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <MarketingShell tone={SOLUTION_TONE[slug].tone} locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />

      <PageHero
        marquee={SOLUTION_TONE[slug].seed}
        pill={s.hero.pill}
        title={s.hero.title}
        text={s.hero.text}
        primary={{ href: create, label: copy.ui.primaryCta, testId: `solution-${slug}-cta` }}
        secondary={{ href: localePath(locale, "/how-it-works"), label: copy.ui.secondaryCta }}
        visual={
          <div className="space-y-10">
            <ModelPile models={sm.pile} locale={locale} />
            <HeroFlow items={s.flow} model={sm.flow} />
          </div>
        }
      />

      {/* 1. The workflow in four steps. */}
      <Section>
        <SectionTitle sub={s.workflow.sub}>{s.workflow.title}</SectionTitle>
        <Workflow steps={s.workflow.steps} />
      </Section>

      {/* 2. The features that matter to this trade. */}
      <Section>
        <ModelSpotlight model={SPOTLIGHT[slug]} locale={locale} flip />
      </Section>

      <Section>
        <SectionTitle sub={s.features.sub}>{s.features.title}</SectionTitle>
        <FeatureBento items={s.features.items} viewer={viewer} labels={copy.visual} model={sm.flow} />
      </Section>

      <Section>
        <SectionTitle sub={rail.sub}>{rail.title}</SectionTitle>
        <ModelRail models={sm.rail} locale={locale} label={rail.label} />
      </Section>

      {/* 3. Honest limits. */}
      <Section>
        <SectionTitle sub={s.expect.sub}>{s.expect.title}</SectionTitle>
        <ExpectBlock expect={s.expect} />
      </Section>

      {/* 4. Integrations that apply, each with its real status. */}
      <Section>
        <SectionTitle sub={s.integrations.sub}>{s.integrations.title}</SectionTitle>
        <IntegrationsBlock
          items={s.integrations.items}
          copy={copy}
          seeAllHref={localePath(locale, "/integrations")}
          seeAllLabel={copy.ui.seeIntegrations}
        />
      </Section>

      {/* 5. FAQ. */}
      <Section>
        <SectionTitle>{s.faq.title}</SectionTitle>
        <FaqList items={s.faq.items} />
      </Section>

      <ClosingBanner art={closingArt(SOLUTION_TONE[slug].art)} titleA={s.closing.titleA} titleB={s.closing.titleB} cta={s.closing.cta} href={create} note={s.closing.note} />
    </MarketingShell>
  );
}
