import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  Box,
  ShieldCheck,
  Layers,
  Cpu,
  FileCheck2,
  Lock,
  Sparkles,
  Check,
  Plus,
  Minus,
  Zap,
  Sliders,
  Database,
  Globe,
} from "lucide-react";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { MarketingShell } from "@/components/marketing-shell";
import { ModelViewerBox } from "@/components/model-viewer-box";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return buildPageMetadata({
    locale,
    path: "/",
    title: dict.meta.home.title,
    description: dict.meta.home.description,
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();
  const isEs = locale === "es";

  // Split heroTitle into two lines: Line 1 White, Line 2 Celeste (keeping exact string inside <h1>)
  const words = dict.home.heroTitle.split(" ");
  const splitIdx = Math.max(2, Math.floor(words.length / 2));
  const titleLead = words.slice(0, splitIdx).join(" ");
  const titleAccent = words.slice(splitIdx).join(" ");

  const sixFeatures = [
    {
      icon: Box,
      title: dict.home.capabilities[0]?.title ?? "GLB Export",
      text: dict.home.capabilities[0]?.text ?? "",
    },
    {
      icon: Zap,
      title: dict.home.capabilities[2]?.title ?? "Interactive 3D Preview",
      text: dict.home.capabilities[2]?.text ?? "",
    },
    {
      icon: Layers,
      title: dict.home.capabilities[1]?.title ?? "Model Library",
      text: dict.home.capabilities[1]?.text ?? "",
    },
    {
      icon: ShieldCheck,
      title: isEs ? "Validación binaria y EXIF" : "Binary & EXIF Guardrails",
      text: isEs
        ? "Decodificación real con sharp, limpieza de metadatos GPS y validación glTF 2.0."
        : "Server-side sharp decode, GPS metadata stripping and strict glTF 2.0 validation.",
    },
    {
      icon: FileCheck2,
      title: isEs ? "Control de intentos con IA" : "AI Attempt & Credit Control",
      text: isEs
        ? "Reserva atómica de intentos con reembolso automático si el proveedor reporta error."
        : "Atomic attempt reservation with automatic refund when the provider reports an error.",
    },
    {
      icon: Lock,
      title: dict.home.capabilities[3]?.title ?? "Hosted Embeds (Planned)",
      text: dict.home.capabilities[3]?.text ?? "",
    },
  ];

  // 12-month bar chart data (matches Image 1 Card 4 "Real-Time Expense Tracking" chart)
  const monthlyBars = [
    { m: "Jan", top: 38, bot: 32 },
    { m: "Feb", top: 48, bot: 42 },
    { m: "Mar", top: 30, bot: 26 },
    { m: "Apr", top: 44, bot: 36 },
    { m: "May", top: 28, bot: 24 },
    { m: "Jun", top: 52, bot: 44 },
    { m: "Jul", top: 34, bot: 30 },
    { m: "Aug", top: 45, bot: 38 },
    { m: "Sep", top: 30, bot: 26 },
    { m: "Oct", top: 49, bot: 40 },
    { m: "Nov", top: 42, bot: 35 },
    { m: "Dec", top: 32, bot: 28 },
  ];

  // 3 pricing cards (matches Image 1 3-column Pricing layout)
  const threePlans = dict.pricing.plans.slice(0, 3);

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1: HERO + HORIZON ARC + PARTNER STANDARDS + 2-COL MOCKUPS (Image 2)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="os-hero-stage pt-6 pb-16 md:pt-8 md:pb-20">
        <div className="container-page relative z-10 flex flex-col items-center text-center">
          {/* Small Pill Badge (`✦ About us` style from Image 2) */}
          <div className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-1 text-xs font-medium text-white backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-mint" aria-hidden="true" />
            <span>{dict.home.heroEyebrow}</span>
          </div>

          {/* Centered Two-Line Headline: White on top, Celeste on bottom */}
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-[48px] leading-[1.12] text-white">
            <span className="block text-white">{titleLead} </span>
            <span className="block text-mint">{titleAccent}</span>
          </h1>

          {/* Centered 2-line Subtitle in Grey */}
          <p className="mt-3 max-w-md text-xs sm:text-sm text-muted leading-relaxed">
            {dict.home.heroSubtitle}
          </p>

          {/* Two Compact Centered Buttons (Solid Celeste w/ Black Text + Dark Frame w/ White Text) */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={localePath(locale, "/dashboard")}
              data-testid="hero-cta-primary"
              className="inline-flex items-center gap-1.5 rounded-lg bg-mint px-5 py-2 text-xs font-bold text-black shadow-[0_0_25px_rgba(56,189,248,0.5)] hover:bg-mint-strong transition-colors"
            >
              <span>{dict.home.ctaPrimary}</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <Link
              href={localePath(locale, "/examples")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-5 py-2 text-xs font-semibold text-white hover:border-mint transition-colors"
            >
              {dict.home.ctaSecondary}
            </Link>
          </div>
        </div>

        {/* Glowing Planetary Horizon Arc (Image 2 center curve) */}
        <div className="mt-3 os-horizon-arc" aria-hidden="true" />

        {/* Partner / Technical Standards Row under the Horizon Arc (Image 2) */}
        <div className="container-page relative z-10 -mt-3 text-center space-y-2.5">
          <p className="text-xs text-muted">
            {isEs
              ? "Construido sobre estándares abiertos y formatos 3D verificados"
              : "Built on verified open standards & 3D commerce formats"}
          </p>
          <div
            className="mx-auto max-w-4xl flex flex-wrap items-center justify-between gap-6 px-4 opacity-80"
            style={{
              maskImage:
                "linear-gradient(90deg, transparent 0%, #000 15%, #000 85%, transparent 100%)",
            }}
          >
            {[
              { icon: Box, name: "glTF 2.0" },
              { icon: Globe, name: "model-viewer" },
              { icon: ShieldCheck, name: "SHA-256" },
              { icon: Layers, name: "Shopify GLB" },
              { icon: Cpu, name: "Sloyd API" },
              { icon: Database, name: "PGlite RLS" },
            ].map((logo) => {
              const Icon = logo.icon;
              return (
                <div
                  key={logo.name}
                  className="flex items-center gap-2 font-display text-sm sm:text-base font-bold text-muted hover:text-white transition-colors"
                >
                  <Icon className="h-4 w-4 text-mint" aria-hidden="true" />
                  <span>{logo.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive 3D Viewer Showcase Framed in Recuadro */}
        <div className="container-page relative z-10 mt-6">
          <div className="os-window-frame mx-auto max-w-4xl">
            <ModelViewerBox
              src="/demo/vase.glb"
              alt={dict.home.viewerAlt}
              hint={dict.home.viewerHint}
              provenanceBadge={dict.home.showcaseBadge}
              resetLabel={dict.dash.detail.resetView}
              autoRotateLabel={dict.dash.detail.autoRotate}
              autoRotateOffLabel={dict.dash.detail.autoRotateOff}
              loadingLabel={dict.dash.detail.viewerLoading}
              errorLabel={dict.dash.detail.viewerError}
              heightClass="h-[240px] sm:h-[270px]"
              testId="hero-model-viewer"
            />
            <p className="mt-2 text-center text-[11px] text-muted">{dict.home.viewerCaption}</p>
          </div>
        </div>

        {/* ── Image 2 Alternating Feature Block 1: Left Text + Vertical Line | Right Framed App Dashboard Window ── */}
        <div className="container-page relative z-10 mt-20 space-y-20">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            {/* Left Column ("Our Values / Improved decision-making" layout) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="text-xs font-semibold text-mint">{dict.home.workflowEyebrow}</div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white leading-snug">
                <span>{dict.home.workflowTitle.split(" ").slice(0, 2).join(" ")} </span>
                <span className="text-mint">
                  {dict.home.workflowTitle.split(" ").slice(2).join(" ")}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                {dict.home.workflowIntro}
              </p>

              <div className="mt-5 space-y-3 border-l border-white/10 pl-4">
                {dict.home.steps.map((s, idx) => (
                  <div
                    key={s.title}
                    className={
                      idx === 0
                        ? "-ml-[17px] border-l-2 border-mint pl-4 space-y-1"
                        : "pt-1"
                    }
                  >
                    <div
                      className={`font-display text-xs sm:text-sm font-semibold ${
                        idx === 0 ? "text-white" : "text-muted"
                      }`}
                    >
                      {s.title}
                    </div>
                    {idx === 0 && (
                      <p className="text-xs text-muted leading-relaxed">{s.text}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Framed App Dashboard Mockup Window (exact style of Image 2 top-right card) */}
            <div className="lg:col-span-7 os-window-frame">
              <div className="rounded-xl border border-white/10 bg-[#050811] p-4 space-y-4">
                {/* Mini Window Navbar */}
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 text-[11px]">
                  <div className="flex items-center gap-1.5 font-display font-bold text-white">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-mint text-[10px] font-bold text-black">
                      O
                    </span>
                    <span>OrbitShelf</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-0.5 text-[10px]">
                    <span className="rounded-md bg-white/10 px-2 py-0.5 text-white font-medium">
                      Overview
                    </span>
                    <span className="px-2 py-0.5 text-muted">Create 3D</span>
                    <span className="px-2 py-0.5 text-muted">Models</span>
                    <span className="px-2 py-0.5 text-muted">Usage</span>
                    <span className="px-2 py-0.5 text-muted">Checklist</span>
                  </div>
                  <span className="h-5 w-5 rounded-full bg-mint/20 border border-mint/40" />
                </div>

                {/* Greeting Row */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-display text-sm font-bold text-white">
                      Workspace · Studio 3D
                    </div>
                    <div className="text-[10px] text-muted">{dict.home.microcopy}</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="rounded-md border border-white/15 bg-white/[0.05] px-2 py-1 text-white">
                      {dict.home.showcaseBadge}
                    </span>
                    <span className="rounded-md border border-white/10 px-2 py-1 text-muted">
                      GLB 2.0
                    </span>
                  </div>
                </div>

                {/* Inner 12-Col Grid: Left Balance/Model Card + Right Metric Cards & Bar Chart */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                  {/* Left Subcard */}
                  <div className="sm:col-span-5 rounded-xl border border-white/10 bg-[#0a101d] p-3.5 flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between text-[10px] text-muted">
                      <span>VASE-001 · GLB</span>
                      <span className="rounded bg-mint/15 px-1.5 py-0.5 text-mint font-mono">
                        SHA-256
                      </span>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted">VALIDATED BINARY</div>
                      <div className="font-display text-lg font-bold text-white">19.1 KB</div>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                        <span className="rounded bg-mint/20 px-1.5 py-0.5 text-mint font-semibold">
                          +5 Checks
                        </span>
                        <span className="text-muted">Ready</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-mint text-black text-[10px] font-bold">
                        3D
                      </span>
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white text-[10px]">
                        ✓
                      </span>
                      <span className="ml-auto text-[10px] text-mint font-semibold">
                        Export GLB →
                      </span>
                    </div>
                  </div>

                  {/* Right Subcards */}
                  <div className="sm:col-span-7 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/10 bg-[#0a101d] p-3">
                        <div className="text-[10px] text-muted">Demo Samples</div>
                        <div className="mt-1 font-display text-base font-bold text-white">
                          3 GLB Files
                        </div>
                        <div className="mt-0.5 text-[10px] text-mint">Free & Instant</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-[#0a101d] p-3">
                        <div className="text-[10px] text-muted">Textured AI Job</div>
                        <div className="mt-1 font-display text-base font-bold text-white">
                          20 Credits
                        </div>
                        <div className="mt-0.5 text-[10px] text-muted">≈ US$0.27 / job</div>
                      </div>
                    </div>

                    {/* Mini Bar Chart with Highlighted Celeste Bar */}
                    <div className="rounded-xl border border-white/10 bg-[#0a101d] p-3">
                      <div className="flex items-center justify-between text-[10px] mb-2">
                        <span className="text-muted">Inspection Checkpoints</span>
                        <span className="font-mono font-semibold text-mint">5 / 5 Required</span>
                      </div>
                      <div className="grid grid-cols-7 items-end gap-2 h-16 pt-2">
                        {[35, 48, 42, 58, 46, 95, 62].map((h, i) => (
                          <div key={i} className="flex flex-col items-center gap-1 h-full justify-end">
                            <div
                              style={{ height: `${h}%` }}
                              className={
                                i === 5
                                  ? "w-full rounded-t bg-mint shadow-[0_0_16px_rgba(56,189,248,0.8)]"
                                  : "w-full rounded-t bg-white/10"
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Image 2 Alternating Feature Block 2: Left Framed Table + Line Chart Window | Right Timeline Text ── */}
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            {/* Left Column: Framed Window with Activity Table + Glowing Line Chart (Image 2 bottom-left) */}
            <div className="order-2 lg:order-1 lg:col-span-6 os-window-frame">
              <div className="rounded-xl border border-white/10 bg-[#050811] p-4 space-y-4">
                {/* Top Subcard: Recent Activity Table */}
                <div className="rounded-xl border border-white/10 bg-[#0a101d] p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-muted">Recent Models & Jobs</div>
                      <div className="font-display text-sm font-bold text-white">
                        3 Sample Assets · 5 Checks
                      </div>
                    </div>
                    <span className="rounded bg-mint/15 px-2 py-0.5 text-[10px] font-semibold text-mint">
                      Verified
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    {dict.examples.items.map((it, idx) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between rounded-lg bg-black/40 px-2.5 py-1.5"
                      >
                        <span className="font-medium text-white">{it.name}</span>
                        <span className="font-mono text-[10px] text-muted">SKU-0{idx + 1}</span>
                        <span className="rounded bg-mint/20 px-2 py-0.5 text-[10px] font-semibold text-mint">
                          {dict.home.showcaseBadge}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Subcard: Glowing Celeste SVG Line Chart */}
                <div className="rounded-xl border border-white/10 bg-[#0a101d] p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-muted">Validation & Review Pipeline</div>
                      <div className="font-display text-sm font-bold text-white">
                        glTF 2.0 Integrity
                      </div>
                    </div>
                    <span className="text-[10px] text-mint font-mono">SHA-256 OK</span>
                  </div>
                  <svg
                    viewBox="0 0 320 90"
                    className="w-full h-24 overflow-visible"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="celesteArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.38" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="22" x2="320" y2="22" stroke="rgba(255,255,255,0.06)" />
                    <line x1="0" y1="48" x2="320" y2="48" stroke="rgba(255,255,255,0.06)" />
                    <line x1="0" y1="74" x2="320" y2="74" stroke="rgba(255,255,255,0.06)" />
                    <path
                      d="M 0 68 L 50 56 L 105 61 L 160 40 L 215 44 L 270 18 L 320 28 L 320 84 L 0 84 Z"
                      fill="url(#celesteArea)"
                    />
                    <path
                      d="M 0 68 L 50 56 L 105 61 L 160 40 L 215 44 L 270 18 L 320 28"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.2"
                    />
                    <path
                      d="M 0 76 L 50 70 L 105 72 L 160 62 L 215 65 L 270 52 L 320 56"
                      fill="none"
                      stroke="rgba(148,163,184,0.35)"
                      strokeWidth="1.5"
                    />
                    <circle cx="270" cy="18" r="4" fill="#38bdf8" />
                  </svg>
                  <div className="flex justify-between font-mono text-[9px] text-muted px-1">
                    <span>10</span>
                    <span>15</span>
                    <span>20</span>
                    <span>25</span>
                    <span>30</span>
                    <span>35</span>
                    <span>40</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column ("2019 / It was founded with a mission" layout) */}
            <div className="order-1 lg:order-2 lg:col-span-6 space-y-6">
              <div className="space-y-3">
                <div className="font-mono text-xs font-bold text-mint">
                  01 · {dict.home.qualityEyebrow}
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                  {dict.home.qualityTitle}
                </h2>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  {dict.home.qualityIntro}
                </p>
              </div>

              <div className="space-y-2 border-t border-white/10 pt-5">
                <div className="font-mono text-xs font-bold text-mint">
                  02 · {dict.home.showcaseEyebrow}
                </div>
                <h3 className="font-display text-lg font-bold text-white">
                  {dict.home.showcaseTitle}
                </h3>
                <p className="text-xs text-muted leading-relaxed">{dict.home.qualityNote}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2: 2×2 BENTO GRID ("Finance for the Modern Business" from Image 1)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 border-t border-white/10">
        <div className="container-page space-y-12">
          <div className="mx-auto max-w-xl text-center space-y-2.5">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
              {dict.home.showcaseTitle}
            </h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              {dict.home.showcaseIntro}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* ── Card 1 (Top-Left, 6 cols): Staggered Tile Grid + Glowing Center Celeste Icon (Image 1 Card 1) ── */}
            <div className="lg:col-span-6 os-bento-card p-6 sm:p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-1.5">
                <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                  {isEs
                    ? "Compatible con estándares 3D de comercio"
                    : "Supports Standard 3D Commerce Formats"}
                </h3>
                <p className="text-xs text-muted leading-relaxed max-w-md">
                  {isEs
                    ? "Valida fotos PNG, JPEG y WebP, elimina metadatos EXIF y verifica binarios glTF 2.0 antes de guardar."
                    : "Validates PNG, JPEG and WebP photos, strips EXIF metadata and verifies glTF 2.0 binaries before storage."}
                </p>
              </div>

              {/* Staggered Brick Grid with Glowing Celeste Center Icon */}
              <div
                className="relative space-y-2.5 py-2"
                style={{
                  maskImage:
                    "radial-gradient(ellipse 90% 85% at 50% 50%, #000 55%, transparent 100%)",
                }}
              >
                <div className="grid grid-cols-4 gap-2.5">
                  {["⚡ PNG", " GLB 2.0", "◎ WebP", "❖ sRGB"].map((t) => (
                    <div
                      key={t}
                      className="flex h-14 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] font-display text-xs font-semibold text-white/40"
                    >
                      {t}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-2.5 items-center">
                  <div className="flex h-14 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-xs font-semibold text-white/35">
                    SHA-256
                  </div>
                  <div className="flex h-14 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-xs font-semibold text-white/35">
                    EXIF-0
                  </div>
                  {/* Center Glowing Celeste Tile */}
                  <div className="flex h-16 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#7dd3fc] via-[#38bdf8] to-[#0284c7] text-black shadow-[0_0_40px_rgba(56,189,248,0.85)]">
                    <Box className="h-7 w-7 stroke-[2.4]" aria-hidden="true" />
                  </div>
                  <div className="flex h-14 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-xs font-semibold text-white/35">
                    PBR 1K
                  </div>
                  <div className="flex h-14 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-xs font-semibold text-white/35">
                    PBR 2K
                  </div>
                </div>
              </div>
            </div>

            {/* ── Card 2 (Top-Right, 6 cols): Concentric Radar + Curved SVG Connectors to 4 Corner Nodes (Image 1 Card 2) ── */}
            <div className="lg:col-span-6 os-bento-card p-6 sm:p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-1.5">
                <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                  {isEs
                    ? " Seguimiento automatizado de trabajos"
                    : "Automated Asynchronous Job Polling"}
                </h3>
                <p className="text-xs text-muted leading-relaxed max-w-md">
                  {isEs
                    ? "Sigue el estado real en cola, ejecución y validación sin barras de progreso falsas."
                    : "Tracks real queued, running and finished provider states without fake progress bars."}
                </p>
              </div>

              {/* Radar Center + 4 Corner Avatar Badges Connected by Curved Glowing Lines */}
              <div className="relative h-44 w-full flex items-center justify-center">
                <svg
                  viewBox="0 0 400 170"
                  className="absolute inset-0 h-full w-full"
                  aria-hidden="true"
                >
                  {/* Curved connectors from center (200,85) to 4 corners */}
                  <path
                    d="M 200 85 L 125 85 Q 110 85 110 65 L 110 42 L 62 42"
                    fill="none"
                    stroke="rgba(56,189,248,0.35)"
                    strokeWidth="1.4"
                  />
                  <path
                    d="M 200 85 L 275 85 Q 290 85 290 65 L 290 42 L 338 42"
                    fill="none"
                    stroke="rgba(56,189,248,0.35)"
                    strokeWidth="1.4"
                  />
                  <path
                    d="M 200 85 L 135 85 Q 120 85 120 105 L 120 132 L 62 132"
                    fill="none"
                    stroke="rgba(56,189,248,0.35)"
                    strokeWidth="1.4"
                  />
                  <path
                    d="M 200 85 L 265 85 Q 280 85 280 105 L 280 132 L 338 132"
                    fill="none"
                    stroke="rgba(56,189,248,0.35)"
                    strokeWidth="1.4"
                  />
                  <circle cx="110" cy="52" r="2.5" fill="#38bdf8" />
                  <circle cx="290" cy="52" r="2.5" fill="#38bdf8" />
                  <circle cx="120" cy="122" r="2.5" fill="#38bdf8" />
                  <circle cx="280" cy="122" r="2.5" fill="#38bdf8" />
                </svg>

                {/* 4 Corner Circular Node Badges */}
                <div className="absolute left-4 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-mint/50 bg-[#0d182c] text-[11px] font-bold text-mint shadow-md">
                  IMG
                </div>
                <div className="absolute right-4 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-mint/50 bg-[#0d182c] text-[11px] font-bold text-white shadow-md">
                  JOB
                </div>
                <div className="absolute left-4 bottom-3 flex h-10 w-10 items-center justify-center rounded-full border border-mint/50 bg-[#0d182c] text-[11px] font-bold text-white shadow-md">
                  CHK
                </div>
                <div className="absolute right-4 bottom-3 flex h-10 w-10 items-center justify-center rounded-full border border-mint/50 bg-[#0d182c] text-[11px] font-bold text-mint shadow-md">
                  GLB
                </div>

                {/* Concentric Glowing Center Circle */}
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-mint/20 bg-mint/[0.04]">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-mint/35 bg-mint/[0.08]">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-mint text-black font-display font-bold text-xs shadow-[0_0_28px_rgba(56,189,248,0.9)]">
                      3D
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Card 3 (Bottom-Left, 5 cols): Stacked Review List with Circular Avatars & Status Pills (Image 1 Card 3) ── */}
            <div className="lg:col-span-5 os-bento-card p-6 sm:p-7 flex flex-col justify-between space-y-5">
              <div className="space-y-1.5">
                <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                  {dict.home.qualityTitle}
                </h3>
                <p className="text-xs text-muted leading-relaxed">{dict.home.qualityIntro}</p>
              </div>

              <div className="space-y-2.5">
                {dict.home.quality.slice(0, 4).map((q, idx) => {
                  const approved = idx < 2;
                  return (
                    <div
                      key={q}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#050811] px-3.5 py-2.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-mint/40 bg-mint/15 font-mono text-xs font-bold text-mint">
                          0{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold text-white">{q}</div>
                          <div className="truncate text-[10px] text-muted">
                            {isEs ? "Revisión manual obligatoria" : "Mandatory manual check"}
                          </div>
                        </div>
                      </div>
                      <span
                        className={
                          approved
                            ? "shrink-0 rounded-md border border-mint/50 bg-mint/15 px-2.5 py-0.5 text-[10px] font-semibold text-mint"
                            : "shrink-0 rounded-md border border-white/20 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-muted"
                        }
                      >
                        {approved
                          ? isEs
                            ? "Aprobado"
                            : "Approved"
                          : isEs
                            ? "Pendiente"
                            : "Pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Card 4 (Bottom-Right, 7 cols): 12-Month Dual-Tone Bar Chart + Floating Celeste Tooltip (Image 1 Card 4) ── */}
            <div className="lg:col-span-7 os-bento-card p-6 sm:p-7 flex flex-col justify-between space-y-5">
              <div className="space-y-1.5">
                <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                  {isEs
                    ? "Control de intentos y créditos en tiempo real"
                    : "Real-Time Attempt & Credit Tracking"}
                </h3>
                <p className="text-xs text-muted leading-relaxed max-w-lg">
                  {isEs
                    ? "Monitorea cada intento descontado o reembolsado en el libro mayor y exporta tu historial en CSV."
                    : "Monitor every debited or refunded attempt in the workspace ledger and export your history as CSV."}
                </p>
              </div>

              {/* Inner Chart Panel matching Image 1 Card 4 */}
              <div className="relative rounded-2xl border border-white/10 bg-[#050811] p-4 space-y-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-white">
                    {isEs ? "Créditos e intentos" : "Attempts and Credits"}
                  </span>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1 text-white">
                      <span className="h-2 w-2 rounded-full bg-mint" />
                      Textured (20c)
                    </span>
                    <span className="flex items-center gap-1 text-muted">
                      <span className="h-2 w-2 rounded-full bg-[#1e293b]" />
                      Geometry (10c)
                    </span>
                  </div>
                </div>

                {/* Floating Celeste Tooltip Box (Image 1 Card 4 overlay) */}
                <div className="sm:absolute sm:right-14 sm:top-10 z-20 rounded-xl bg-mint px-3.5 py-2 text-[10px] font-bold text-black shadow-[0_10px_30px_rgba(56,189,248,0.55)]">
                  <div className="flex items-center justify-between gap-4">
                    <span>Sloyd API · 1K/2K</span>
                    <span className="font-mono">20 credits</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-black/80">
                    <span>75 cr = US$1.00</span>
                    <span className="font-mono">≈ US$0.27</span>
                  </div>
                </div>

                {/* Y-axis + 12 Monthly Bars */}
                <div className="flex items-end gap-2.5 pt-2">
                  <div className="flex flex-col justify-between h-32 text-[9px] font-mono text-muted pr-1">
                    <span>40c</span>
                    <span>30c</span>
                    <span>20c</span>
                    <span>10c</span>
                    <span>0</span>
                  </div>
                  <div className="flex-1 grid grid-cols-12 items-end gap-2 h-32">
                    {monthlyBars.map((b, i) => (
                      <div
                        key={b.m}
                        className="flex flex-col items-center justify-end h-full gap-1"
                      >
                        <div className="w-full flex flex-col justify-end h-24">
                          <div
                            style={{ height: `${b.top}%` }}
                            className={
                              i === 5
                                ? "w-full rounded-t-md bg-mint shadow-[0_0_16px_rgba(56,189,248,0.9)]"
                                : "w-full rounded-t-md bg-mint/85"
                            }
                          />
                          <div
                            style={{ height: `${b.bot}%` }}
                            className="w-full rounded-b-md bg-[#1c283d]"
                          />
                        </div>
                        <span className="font-mono text-[9px] text-muted">{b.m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3: 6-CARD FEATURE GRID (3×2) ("Banking Reimagined..." from Image 1)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 border-t border-white/10">
        <div className="container-page space-y-12">
          <div className="mx-auto max-w-xl text-center space-y-2.5">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
              {dict.home.capabilitiesTitle}
            </h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              {dict.home.workflowIntro}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sixFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="os-bento-card px-6 py-8 flex flex-col items-center text-center space-y-3"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-mint">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="pt-1 font-display text-base font-bold text-white">
                    {feat.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted max-w-[260px]">
                    {feat.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 4: 3-COLUMN PRICING CARDS ("Flexible Plans..." from Image 1)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 border-t border-white/10">
        <div className="container-page space-y-12">
          <div className="mx-auto max-w-xl text-center space-y-4">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight">
              {dict.home.pricingTitle}
            </h2>
            <p className="text-xs sm:text-sm text-muted">{dict.home.pricingIntro}</p>

            {/* Centered Pill Toggle (`[ Monthly | Yearly -20% ]` style from Image 1) */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[#0a101d] p-1 text-xs">
              <span className="rounded-full bg-mint px-4 py-1 font-bold text-black">
                {dict.pricing.perMonth}
              </span>
              <span className="px-2.5 py-1 text-muted">{dict.pricing.perOnce}</span>
              <span className="mr-1 rounded-full bg-mint/20 border border-mint/40 px-2 py-0.5 text-[10px] font-bold text-mint">
                {dict.common.demo}
              </span>
            </div>
          </div>

          <div className="mx-auto max-w-5xl grid grid-cols-1 gap-6 md:grid-cols-3">
            {threePlans.map((p, idx) => {
              const isCenter = idx === 1;
              return (
                <div
                  key={p.id}
                  className={
                    isCenter
                      ? "os-bento-card-featured p-7 flex flex-col justify-between space-y-6"
                      : "os-bento-card p-7 flex flex-col justify-between space-y-6"
                  }
                >
                  <div className="space-y-5">
                    <div>
                      <h3 className="font-display text-lg font-bold text-white">{p.name}</h3>
                      <p className="mt-1 text-xs text-muted">
                        {p.attempts} {dict.pricing.attempts}
                      </p>
                    </div>

                    <div className="flex items-baseline gap-1 pt-2">
                      <span className="font-display text-4xl font-bold text-white">
                        ${p.price}
                      </span>
                      <span className="text-xs text-muted">
                        {p.period === "once" ? ` ${dict.pricing.perOnce}` : dict.pricing.perMonth}
                      </span>
                    </div>

                    <Link
                      href={localePath(locale, "/pricing")}
                      className={
                        isCenter
                          ? "block w-full rounded-xl bg-mint py-2.5 text-center text-xs font-bold text-black shadow-[0_6px_24px_rgba(56,189,248,0.45)] hover:bg-mint-strong transition-colors"
                          : "block w-full rounded-xl border border-white/15 bg-white/[0.05] py-2.5 text-center text-xs font-semibold text-white hover:border-mint transition-colors"
                      }
                    >
                      {dict.home.pricingCta}
                    </Link>

                    <ul className="space-y-2.5 pt-2 text-xs">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          {isCenter ? (
                            <span
                              className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-mint shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                              aria-hidden="true"
                            />
                          ) : (
                            <Check className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                          )}
                          <span className="text-white/90">{f}</span>
                        </li>
                      ))}
                      {p.planned.map((pl) => (
                        <li key={pl} className="flex items-start gap-2.5 text-muted">
                          <Sliders className="h-3.5 w-3.5 shrink-0 text-mint/60" aria-hidden="true" />
                          <span>
                            {pl} ({dict.pricing.plannedLabel})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 5: 2-COLUMN FAQ ("Your Questions" from Image 1 bottom)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 border-t border-white/10">
        <div className="container-page space-y-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
            <div className="lg:col-span-5 space-y-3">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
                {dict.home.faqTitle}
              </h2>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                {dict.home.finalText}
              </p>
            </div>

            <div className="lg:col-span-7 space-y-3">
              {dict.home.faqs.map((f, idx) => (
                <details
                  key={f.q}
                  open={idx === 0}
                  className={
                    idx === 0
                      ? "group os-bento-card-featured px-5 py-4"
                      : "group os-bento-card px-5 py-4"
                  }
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-sm font-semibold text-white">
                    <span>
                      {idx + 1}. {f.q}
                    </span>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/[0.05] text-white">
                      <Plus className="h-3.5 w-3.5 group-open:hidden" aria-hidden="true" />
                      <Minus className="hidden h-3.5 w-3.5 group-open:block text-mint" aria-hidden="true" />
                    </span>
                  </summary>
                  <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-relaxed text-muted">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
