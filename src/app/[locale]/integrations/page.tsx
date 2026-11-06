import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Bot, Box, Boxes, Code2, Globe, KeyRound, Layers, ShieldCheck, ShoppingCart, Store, Webhook, Ban, CheckCheck } from "lucide-react";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { MarketingShell } from "@/components/marketing-shell";
import { ModelViewerBox } from "@/components/model-viewer-box";
import { Card, ClosingBanner, FaqList, PageHero, Section, SectionTitle, StatusBadge, Tag, Tile } from "@/components/marketing-kit";
import {
  API_PATHS,
  EMBED_SNIPPET,
  INTEGRATION_ORDER,
  INTEGRATION_STATUS,
  MCP_TOOLS,
  SIGNATURE_SNIPPET,
  WEBHOOK_EVENTS,
  integrationsCopy,
  type IntegrationId,
  type IntegrationStatus,
} from "@/content/integrations";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const c = integrationsCopy[locale];
  return buildPageMetadata({ locale, path: "/integrations", title: c.meta.title, description: c.meta.description });
}

const DOCS_PATH = "/resources/glb-export-and-shopify";

function statusTone(s: IntegrationStatus): "ok" | "warn" | "muted" {
  return s === "available" ? "ok" : s === "testing" ? "warn" : "muted";
}

/** A code block that scrolls inside its card, never the page. */
function CodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <pre
      tabIndex={0}
      role="group"
      aria-label={label}
      className="max-w-full overflow-x-auto rounded-2xl border border-line bg-bg p-4 font-mono text-xs leading-relaxed text-fg"
    >
      <code>{code}</code>
    </pre>
  );
}

/** A short monospace chip. Wraps instead of overflowing. */
function CodeChip({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <code
      className={`inline-block max-w-full break-all rounded-lg border px-2.5 py-1 font-mono text-xs ${
        accent ? "border-accent/50 bg-blood/15 text-fg" : "border-line bg-bg text-fg"
      }`}
    >
      {children}
    </code>
  );
}

export default async function IntegrationsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();
  const c = integrationsCopy[locale];
  const create = localePath(locale, "/dashboard/create");
  const docs = localePath(locale, DOCS_PATH);

  const viewerLabels = {
    resetLabel: dict.dash.detail.resetView,
    autoRotateLabel: dict.dash.detail.autoRotate,
    autoRotateOffLabel: dict.dash.detail.autoRotateOff,
    loadingLabel: dict.dash.detail.viewerLoading,
    errorLabel: dict.dash.detail.viewerError,
  };

  const number = (id: IntegrationId) => INTEGRATION_ORDER.findIndex((i) => i.id === id) + 1;

  /** Number, name tag and status badge: the top line of every integration card. */
  function head(id: IntegrationId) {
    const status = INTEGRATION_STATUS[id];
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold tabular-nums"
        >
          {number(id)}
        </span>
        <Tag>{c.items[id].name}</Tag>
        <StatusBadge tone={statusTone(status)}>{c.status[status]}</StatusBadge>
      </div>
    );
  }

  /** Title, one line of what it does, then how you would use it in 2 or 3 steps. */
  function body(id: IntegrationId, wide = false) {
    const item = c.items[id];
    return (
      <div className="space-y-5">
        <div className="space-y-3">
          <h3 className={`${wide ? "text-2xl" : "text-xl"} font-semibold leading-tight`}>{item.title}</h3>
          <p className="max-w-xl text-sm leading-relaxed text-muted">{item.text}</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-fg">{c.howLabel}</p>
          <ol className="space-y-2 text-sm text-muted">
            {item.steps.map((s, i) => (
              <li key={s} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs font-semibold tabular-nums text-fg"
                >
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
        {item.note ? <p className="border-l-2 border-accent pl-3 text-xs leading-relaxed text-muted">{item.note}</p> : null}
      </div>
    );
  }

  const d = c.hero.diagram;
  const diagramItems: { icon: React.ReactNode; label: string }[] = [
    { icon: <Globe className="h-6 w-6" />, label: d.embed },
    { icon: <Store className="h-6 w-6" />, label: d.shopify },
    { icon: <Box className="h-6 w-6" />, label: d.blender },
    { icon: <Code2 className="h-6 w-6" />, label: d.api },
    { icon: <Bot className="h-6 w-6" />, label: d.mcp },
    { icon: <ShoppingCart className="h-6 w-6" />, label: d.woo },
  ];

  const safetyIcons = [KeyRound, ShieldCheck, Webhook, Ban, CheckCheck];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <PageHero
        pill={c.hero.pill}
        title={c.hero.title}
        text={c.hero.text}
        primary={{ href: docs, label: c.hero.docs, testId: "integrations-cta-docs" }}
        secondary={{ href: create, label: c.hero.create }}
        visual={
          <div
            role="img"
            aria-label={c.hero.diagramLabel}
            data-testid="integrations-diagram"
            className="mesh-lines mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-[24px] border border-line bg-[#1b0b0c] px-5 py-8 md:flex-row md:justify-center md:gap-8"
          >
            <Tile tone="blood" label={d.model}>
              <Box className="h-6 w-6" />
            </Tile>
            <ArrowRight className="h-5 w-5 shrink-0 rotate-90 text-accent md:rotate-0" />
            <div className="flex flex-wrap items-start justify-center gap-4">
              {diagramItems.map((t) => (
                <Tile key={t.label} label={t.label}>
                  {t.icon}
                </Tile>
              ))}
            </div>
          </div>
        }
      />

      <Section>
        <SectionTitle sub={c.bento.sub}>{c.bento.title}</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {/* 1. Web embed: large, with a demo viewer inside a drawn page. */}
          <Card lift className="min-w-0 space-y-8 md:col-span-6 md:grid md:grid-cols-2 md:gap-8 md:space-y-0 md:p-9">
            <div className="flex min-w-0 flex-col justify-between gap-8">
              <div className="space-y-6">
                {head("embed")}
                {body("embed", true)}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-fg">{c.embedExtra.snippetLabel}</p>
                <CodeBlock code={EMBED_SNIPPET} label={c.embedExtra.snippetLabel} />
                <p className="text-xs text-muted">{c.embedExtra.glbLine}</p>
              </div>
            </div>
            <div className="min-w-0 space-y-3">
              <div className="overflow-hidden rounded-2xl border border-line bg-bg">
                <div aria-hidden="true" className="flex items-center gap-2 border-b border-line px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="ml-2 h-5 flex-1 rounded-full bg-white/10" />
                </div>
                <div className="space-y-4 p-4">
                  <ModelViewerBox
                    src="/demo/vase.glb"
                    alt={c.embedExtra.viewerAlt}
                    heightClass="h-[260px] md:h-[320px]"
                    testId="integrations-embed-viewer"
                    wheelZoom={false}
                    {...viewerLabels}
                  />
                  <div aria-hidden="true" className="space-y-2">
                    <span className="block h-3 w-2/3 rounded-full bg-white/15" />
                    <span className="block h-3 w-1/3 rounded-full bg-white/10" />
                    <span className="mt-3 block h-9 w-32 rounded-full bg-blood" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted">{c.embedExtra.sample}</p>
            </div>
          </Card>

          {/* 2. Shopify (wide) and 3. Blender (narrow). */}
          <Card lift className="min-w-0 space-y-8 md:col-span-4 md:p-9">
            {head("shopify")}
            {body("shopify", true)}
            <div aria-hidden="true" className="flex flex-wrap items-center gap-3 sm:gap-4">
              <Tile tone="blood" label={c.shopifyExtra.flow[0]}>
                <Box className="h-6 w-6" />
              </Tile>
              <ArrowRight className="h-5 w-5 shrink-0 text-accent" />
              <Tile label={c.shopifyExtra.flow[1]}>
                <Store className="h-6 w-6" />
              </Tile>
              <ArrowRight className="h-5 w-5 shrink-0 text-accent" />
              <Tile label={c.shopifyExtra.flow[2]}>
                <Layers className="h-6 w-6" />
              </Tile>
            </div>
            <Link href={docs} className="inline-flex items-center gap-2 text-sm font-semibold text-fg underline underline-offset-4 hover:text-accent">
              {c.shopifyExtra.docsLink}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Card>

          <Card lift className="min-w-0 space-y-8 md:col-span-2">
            {head("blender")}
            {body("blender")}
          </Card>

          {/* 4. API (narrow) and the signature recipe (wide). */}
          <Card lift className="min-w-0 space-y-6 md:col-span-2">
            {head("api")}
            {body("api")}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-fg">{c.apiExtra.pathsLabel}</p>
              <div className="flex flex-wrap gap-2">
                {API_PATHS.map((p) => (
                  <CodeChip key={p}>{p}</CodeChip>
                ))}
              </div>
            </div>
          </Card>

          <Card className="min-w-0 space-y-6 md:col-span-4 md:p-9">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Tag>{c.signature.tag}</Tag>
                <StatusBadge tone="warn">{c.status.testing}</StatusBadge>
              </div>
              <h3 className="text-2xl font-semibold leading-tight">{c.signature.title}</h3>
              <p className="max-w-xl text-sm leading-relaxed text-muted">{c.signature.text}</p>
            </div>
            <CodeBlock code={SIGNATURE_SNIPPET} label={c.signature.codeLabel} />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-fg">{c.signature.eventsLabel}</p>
              <div className="flex flex-wrap gap-2">
                {WEBHOOK_EVENTS.map((e) => (
                  <CodeChip key={e} accent>
                    {e}
                  </CodeChip>
                ))}
              </div>
            </div>
            <ul className="space-y-1.5 text-xs leading-relaxed text-muted">
              {c.signature.notes.map((n) => (
                <li key={n} className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                  {n}
                </li>
              ))}
            </ul>
          </Card>

          {/* 5. MCP (wide) and 6. WooCommerce (narrow). */}
          <Card lift className="min-w-0 space-y-8 md:col-span-4 md:p-9">
            {head("mcp")}
            {body("mcp", true)}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-fg">{c.mcpExtra.toolsLabel}</p>
              <div className="flex flex-wrap gap-2">
                {MCP_TOOLS.map((t) => (
                  <CodeChip key={t} accent={t === "create_generation"}>
                    {t}
                  </CodeChip>
                ))}
              </div>
              <p className="text-xs text-muted">
                <code className="font-mono text-fg">create_generation</code>: {c.mcpExtra.confirmLabel}
              </p>
            </div>
          </Card>

          <Card className="mesh-lines min-w-0 space-y-6 md:col-span-2">
            {head("woocommerce")}
            <div aria-hidden="true" className="flex">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-line bg-surface-2 text-muted">
                <ShoppingCart className="h-7 w-7" />
              </span>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold leading-tight">{c.items.woocommerce.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{c.items.woocommerce.text}</p>
              <p className="text-sm leading-relaxed text-muted">{c.items.woocommerce.steps[0]}</p>
            </div>
          </Card>
        </div>
      </Section>

      {/* How we keep it safe: one wide card, five short points. */}
      <Section>
        <SectionTitle sub={c.safety.sub}>{c.safety.title}</SectionTitle>
        <Card className="md:p-9">
          <ul className="grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-6">
            {c.safety.points.map((p, i) => {
              const Icon = safetyIcons[i] ?? ShieldCheck;
              return (
                <li key={p.title} className={`flex items-start gap-4 ${i < 3 ? "md:col-span-2" : "md:col-span-3"}`}>
                  <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blood text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold leading-tight">{p.title}</h3>
                    <p className="text-sm leading-relaxed text-muted">{p.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </Section>

      {/* After validation: a smaller row. */}
      <Section>
        <SectionTitle sub={c.after.sub}>{c.after.title}</SectionTitle>
        <ul className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          {c.after.items.map((it, i) => (
            <li key={it.name} className="card reveal flex items-start gap-4 p-6">
              <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-2 text-fg">
                {i === 0 ? <Boxes className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
              </span>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold">{it.name}</h3>
                  <StatusBadge>{c.status.planned}</StatusBadge>
                </div>
                <p className="text-sm leading-relaxed text-muted">{it.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionTitle>{c.faqTitle}</SectionTitle>
        <FaqList items={c.faqs} />
      </Section>

      <ClosingBanner titleA={c.closing.titleA} titleB={c.closing.titleB} cta={c.closing.cta} href={create} note={c.closing.note} />
    </MarketingShell>
  );
}
