import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
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

  // Split heroTitle into two visual parts so the second half shines in celeste while keeping the exact text inside <h1>
  const words = dict.home.heroTitle.split(" ");
  const splitIdx = Math.max(2, Math.floor(words.length / 2));
  const titleLead = words.slice(0, splitIdx).join(" ");
  const titleAccent = words.slice(splitIdx).join(" ");

  const sixFeatures = [
    {
      icon: Box,
      title: dict.home.capabilities[0]?.title ?? "GLB Export",
      status: dict.home.capabilities[0]?.status ?? "Available",
      text: dict.home.capabilities[0]?.text ?? "",
    },
    {
      icon: Layers,
      title: dict.home.capabilities[1]?.title ?? "Model Library",
      status: dict.home.capabilities[1]?.status ?? "Available",
      text: dict.home.capabilities[1]?.text ?? "",
    },
    {
      icon: Cpu,
      title: dict.home.capabilities[2]?.title ?? "Interactive 3D",
      status: dict.home.capabilities[2]?.status ?? "Available",
      text: dict.home.capabilities[2]?.text ?? "",
    },
    {
      icon: ShieldCheck,
      title: isEs ? "Validación binaria y EXIF" : "Binary & EXIF Validation",
      status: dict.home.capabilities[0]?.status ?? "Available",
      text: isEs
        ? "Decodificación real con sharp, eliminación de metadatos GPS/EXIF y verificación estricta glTF 2.0."
        : "Server-side sharp decode, GPS/EXIF metadata stripping and strict glTF 2.0 structure validation.",
    },
    {
      icon: FileCheck2,
      title: isEs ? "Libro mayor y reembolsos" : "Attempt Ledger & Refunds",
      status: dict.home.capabilities[0]?.status ?? "Available",
      text: isEs
        ? "Reserva atómica de intentos con claves de idempotencia y reembolso automático ante errores verificados."
        : "Atomic attempt reservation with idempotency keys and automatic refund on verified provider errors.",
    },
    {
      icon: Lock,
      title: dict.home.capabilities[3]?.title ?? "Hosted Embeds",
      status: dict.home.capabilities[3]?.status ?? "Planned",
      text: dict.home.capabilities[3]?.text ?? "",
    },
  ];

  const standardsStrip = [
    "glTF 2.0 Binary",
    "<model-viewer>",
    "SHA-256 Verified",
    "EXIF Stripped",
    "PBR Textures",
    "Shopify GLB Ready",
  ];

  const creditBars = [
    { label: "Jan", geo: 38, tex: 68 },
    { label: "Feb", geo: 52, tex: 84 },
    { label: "Mar", geo: 34, tex: 58 },
    { label: "Apr", geo: 46, tex: 74 },
    { label: "May", geo: 30, tex: 62 },
    { label: "Jun", geo: 58, tex: 94, active: true },
    { label: "Jul", geo: 42, tex: 70 },
    { label: "Aug", geo: 49, tex: 80 },
    { label: "Sep", geo: 36, tex: 64 },
    { label: "Oct", geo: 54, tex: 88 },
  ];

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      {/* ═══════════════════════════════════════════════════════════════════════
          1. CENTERED HERO + CELESTE HORIZON ARC + 3D VIEWER SHOWCASE (Image 2)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="os-hero-stage pt-10 pb-16 md:pt-16 md:pb-24">
        <div className="container-page relative z-10 flex flex-col items-center text-center">
          {/* Small Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-mint/30 bg-surface/90 px-4 py-1.5 text-xs font-medium text-fg shadow-lg">
            <Sparkles className="h-3.5 w-3.5 text-mint" aria-hidden="true" />
            <span>{dict.home.heroEyebrow}</span>
          </div>

          {/* Two-Tone Centered Headline (White + Celeste) */}
          <h1 className="mt-6 max-w-4xl font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-[1.08] text-fg">
            <span>{titleLead} </span>
            <span className="text-mint">{titleAccent}</span>
          </h1>

          {/* Subtitle in Soft Slate Grey */}
          <p className="mt-5 max-w-2xl text-sm sm:text-base text-muted leading-relaxed">
            {dict.home.heroSubtitle}
          </p>

          {/* Centered Dual CTA Buttons (Celeste w/ Black Text + Dark Glass w/ White Text) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href={localePath(locale, "/dashboard")}
              data-testid="hero-cta-primary"
              className="inline-flex items-center gap-2 rounded-xl bg-mint px-6 py-3 text-xs sm:text-sm font-bold text-bg shadow-[0_0_28px_rgba(56,189,248,0.45)] hover:bg-mint-strong transition-colors"
            >
              <span>{dict.home.ctaPrimary}</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href={localePath(locale, "/examples")}
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface/90 px-6 py-3 text-xs sm:text-sm font-semibold text-fg hover:border-mint transition-colors"
            >
              {dict.home.ctaSecondary}
            </Link>
          </div>

          <p className="mt-3 text-xs text-muted">{dict.home.microcopy}</p>
        </div>

        {/* Glowing Celeste Planetary Horizon Arc */}
        <div className="mt-8 os-horizon-arc" aria-hidden="true" />

        {/* Interactive 3D Viewer Framed Below the Horizon Arc */}
        <div className="container-page relative z-10 -mt-6">
          <div className="mx-auto max-w-4xl os-bento-card p-3 sm:p-5">
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
              heightClass="h-[360px] sm:h-[420px]"
              testId="hero-model-viewer"
            />
            <p className="mt-2.5 text-center text-xs text-muted">{dict.home.viewerCaption}</p>
          </div>

          {/* Technical Standards Strip (matches the horizontal strip below the horizon in Image 2) */}
          <div className="mt-14 text-center space-y-5">
            <p className="text-xs font-medium uppercase tracking-widest text-muted">
              {isEs
                ? "Estándares técnicos y controles de integridad verificados"
                : "Verified technical standards & integrity guardrails"}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-85">
              {standardsStrip.map((std) => (
                <div
                  key={std}
                  className="flex items-center gap-2 font-display text-xs sm:text-sm font-semibold tracking-tight text-muted hover:text-fg transition-colors"
                >
                  <span className="h-2 w-2 rounded-full bg-mint" aria-hidden="true" />
                  <span>{std}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. ALTERNATING 2-COLUMN DEEP-DIVE SECTIONS (Image 2 bottom)
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 border-t border-line/60">
        <div className="container-page space-y-24">
          {/* Row A: Left Text + Vertical Accented Steps | Right Studio Telemetry Mockup */}
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5 space-y-5">
              <span className="text-xs font-semibold uppercase tracking-widest text-mint">
                {dict.home.workflowEyebrow}
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight text-fg">
                <span>{dict.home.workflowTitle.split(",")[0]}</span>
                {dict.home.workflowTitle.includes(",") && (
                  <span className="text-mint">
                    ,{dict.home.workflowTitle.split(",").slice(1).join(",")}
                  </span>
                )}
              </h2>
              <p className="text-sm text-muted leading-relaxed">{dict.home.workflowIntro}</p>

              <div className="space-y-3 pt-2">
                {dict.home.steps.map((s, idx) => (
                  <div
                    key={s.title}
                    className={`border-l-2 pl-4 py-1 transition-colors ${
                      idx === 0 ? "border-mint" : "border-line hover:border-mint/60"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-mint">0{idx + 1}</span>
                      <h3 className="font-display text-sm font-semibold text-fg">{s.title}</h3>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Dark Glass Studio Card */}
            <div className="lg:col-span-7 os-bento-card p-6 sm:p-7 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-mint" />
                  <span className="font-display text-xs font-semibold text-fg">
                    OrbitShelf 3D Studio · Workspace
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="rounded-md bg-mint px-2.5 py-0.5 font-bold text-bg">
                    {dict.home.showcaseBadge}
                  </span>
                  <span className="rounded-md border border-line bg-bg px-2.5 py-0.5 text-muted">
                    glTF 2.0
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {dict.examples.items.map((item, i) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-line bg-bg/85 p-4 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-muted">
                        <span className="font-mono text-mint">SKU-0{i + 1}</span>
                        <span>GLB</span>
                      </div>
                      <h3 className="mt-1.5 font-display text-sm font-semibold text-fg">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-xs text-muted line-clamp-2">{item.text}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-line/60 pt-2.5 text-[11px]">
                      <span className="text-mint font-medium">{dict.home.showcaseBadge}</span>
                      <Link
                        href={localePath(locale, "/examples")}
                        className="font-semibold text-fg hover:text-mint"
                      >
                        3D →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted">{dict.home.showcaseNote}</p>
            </div>
          </div>

          {/* Row B (Inverted): Left Visual Telemetry Card | Right Text */}
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="order-2 lg:order-1 lg:col-span-7 os-bento-card p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <div className="text-xs text-muted">{dict.home.qualityEyebrow}</div>
                  <div className="font-display text-base font-bold text-fg">
                    {dict.home.qualityTitle}
                  </div>
                </div>
                <span className="rounded-full border border-mint/40 bg-mint/10 px-3 py-1 text-xs font-semibold text-mint">
                  5 / 5 Checks
                </span>
              </div>

              <ul className="space-y-2.5">
                {dict.home.quality.map((item, idx) => (
                  <li
                    key={item}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg/80 px-4 py-2.5 text-xs sm:text-sm"
                  >
                    <span className="flex items-center gap-2.5 text-fg">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-mint" aria-hidden="true" />
                      <span>{item}</span>
                    </span>
                    <span className="rounded-md bg-mint/15 border border-mint/30 px-2 py-0.5 font-mono text-[11px] font-semibold text-mint shrink-0">
                      0{idx + 1} · OK
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="order-1 lg:order-2 lg:col-span-5 space-y-4">
              <span className="font-mono text-xs font-semibold uppercase tracking-widest text-mint">
                2026 · {dict.home.qualityEyebrow}
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight text-fg">
                {dict.home.qualityTitle}
              </h2>
              <p className="text-sm text-muted leading-relaxed">{dict.home.qualityIntro}</p>
              <p className="rounded-xl border border-line bg-surface p-4 text-xs text-muted leading-relaxed">
                {dict.home.qualityNote}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. 2×2 BENTO GRID SECTION (Matches Image 1 top: "Finance for the Modern Business")
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 border-t border-line/60">
        <div className="container-page space-y-12">
          <div className="mx-auto max-w-2xl text-center space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-mint">
              {dict.home.showcaseEyebrow}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-fg">
              {dict.home.showcaseTitle}
            </h2>
            <p className="text-sm text-muted leading-relaxed">{dict.home.showcaseIntro}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Bento Card 1 (Top-Left, 6 cols): Format & Binary Guardrails */}
            <div className="lg:col-span-6 os-bento-card p-6 sm:p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-1.5">
                <h3 className="font-display text-lg sm:text-xl font-bold text-fg">
                  {isEs
                    ? "Validación estricta de formatos y binarios"
                    : "Strict Format & Binary Validation"}
                </h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  {isEs
                    ? "Inspección de bytes mágicos, decodificación sharp, limpieza EXIF/GPS y verificación de chunks glTF 2.0."
                    : "Magic-byte inspection, sharp decode, EXIF/GPS stripping and glTF 2.0 chunk bounds verification."}
                </p>
              </div>

              {/* 3x3 Tile Matrix with Glowing Center Celeste Badge (Matches Image 1 Card 1) */}
              <div className="relative grid grid-cols-3 gap-2.5 pt-2">
                {[
                  "PNG 24-bit",
                  "JPEG / sRGB",
                  "WebP Still",
                  "EXIF Stripped",
                  "ORBIT 3D",
                  "GLB Binary",
                  "SHA-256",
                  "No SVG/XSS",
                  "Bounds OK",
                ].map((label, idx) =>
                  idx === 4 ? (
                    <div
                      key={label}
                      className="flex flex-col items-center justify-center rounded-2xl bg-mint py-5 px-3 text-bg font-display font-bold text-xs shadow-[0_0_35px_rgba(56,189,248,0.65)]"
                    >
                      <Box className="h-6 w-6 stroke-[2.2]" aria-hidden="true" />
                      <span className="mt-1 tracking-wider">{label}</span>
                    </div>
                  ) : (
                    <div
                      key={label}
                      className="flex items-center justify-center rounded-xl border border-line/80 bg-bg/75 py-4 px-2 text-center font-mono text-[11px] font-medium text-muted"
                    >
                      {label}
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Bento Card 2 (Top-Right, 6 cols): Asynchronous Job Pipeline Hub */}
            <div className="lg:col-span-6 os-bento-card p-6 sm:p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-1.5">
                <h3 className="font-display text-lg sm:text-xl font-bold text-fg">
                  {isEs
                    ? "Seguimiento asíncrono de trabajos 3D"
                    : "Asynchronous 3D Job Orchestration"}
                </h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  {isEs
                    ? "El poller del servidor consulta el estado real del proveedor y almacena el GLB en privado al terminar."
                    : "The durable server poller tracks real provider job states and copies the finished GLB into private storage."}
                </p>
              </div>

              {/* Central Celeste Hub Connected to 4 Nodes (Matches Image 1 Card 2) */}
              <div className="relative flex items-center justify-between rounded-2xl border border-line/70 bg-bg/70 p-5 sm:p-6">
                <div className="space-y-4 z-10">
                  <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full bg-mint" />
                    <span className="font-medium text-fg">01 · Upload</span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full bg-mint" />
                    <span className="font-medium text-fg">02 · Queue</span>
                  </div>
                </div>

                {/* Glowing Center Core */}
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border border-mint/40 bg-mint/10 shadow-[0_0_40px_rgba(56,189,248,0.35)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint text-bg font-display font-bold text-xs shadow-lg">
                    GLB
                  </div>
                </div>

                <div className="space-y-4 z-10">
                  <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full bg-mint" />
                    <span className="font-medium text-fg">03 · Mesh</span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full bg-mint" />
                    <span className="font-medium text-fg">04 · Review</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Card 3 (Bottom-Left, 5 cols): Review Queue Status List */}
            <div className="lg:col-span-5 os-bento-card p-6 sm:p-7 flex flex-col justify-between space-y-5">
              <div className="space-y-1.5">
                <h3 className="font-display text-lg sm:text-xl font-bold text-fg">
                  {isEs ? "Control de calidad por lote" : "Catalog Review Gate"}
                </h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  {isEs
                    ? "Cada modelo muestra su procedencia real (Muestra demo vs Generado con IA) y su estado de revisión."
                    : "Every asset displays its true provenance (Demo sample vs AI-generated) and review decision."}
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: "Ceramic Vase · VASE-001", tag: dict.home.showcaseBadge, state: "Approved", ok: true },
                  { name: "Table Lamp · LAMP-002", tag: dict.home.showcaseBadge, state: "Approved", ok: true },
                  { name: "Accent Chair · CHAIR-003", tag: dict.home.showcaseBadge, state: "Pending", ok: false },
                ].map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between gap-2 rounded-xl border border-line bg-bg/85 px-3.5 py-2.5 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-fg">{row.name}</div>
                      <div className="text-[11px] text-muted">{row.tag}</div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        row.ok
                          ? "bg-mint text-bg"
                          : "border border-mint/40 bg-mint/10 text-mint"
                      }`}
                    >
                      {row.state}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bento Card 4 (Bottom-Right, 7 cols): Real-Time Credit & Cost Tracking Bar Chart */}
            <div className="lg:col-span-7 os-bento-card p-6 sm:p-7 flex flex-col justify-between space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-display text-lg sm:text-xl font-bold text-fg">
                    {isEs
                      ? "Seguimiento transparente de intentos y créditos"
                      : "Transparent Attempt & Provider Credit Tracking"}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted">
                    {isEs
                      ? "10 créditos solo geometría · 20 créditos con textura (≈ US$0,27 por intento según tarifa publicada)."
                      : "10 credits geometry-only · 20 credits textured (≈ US$0.27 per attempt at published provider rates)."}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1.5 text-fg">
                    <span className="h-2.5 w-2.5 rounded-full bg-mint" />
                    Textured (20 cr)
                  </span>
                  <span className="flex items-center gap-1.5 text-muted">
                    <span className="h-2.5 w-2.5 rounded-full bg-surface-2 border border-line" />
                    Geometry (10 cr)
                  </span>
                </div>
              </div>

              {/* Bar Chart with Floating Celeste Callout (Matches Image 1 Card 4) */}
              <div className="relative rounded-2xl border border-line/70 bg-bg/80 p-4 pt-8">
                {/* Floating Celeste Tooltip */}
                <div className="mb-3 inline-flex items-center gap-3 rounded-xl bg-mint px-3.5 py-1.5 text-xs font-bold text-bg shadow-[0_8px_24px_rgba(56,189,248,0.4)]">
                  <span>1K / 2K Texture: 20 cr</span>
                  <span className="rounded bg-bg/15 px-1.5 py-0.5 font-mono text-[11px]">
                    ≈ US$0.27
                  </span>
                </div>

                <div className="grid grid-cols-10 items-end gap-2 h-28 pt-2">
                  {creditBars.map((b) => (
                    <div key={b.label} className="flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full flex flex-col justify-end gap-0.5 h-20">
                        <div
                          style={{ height: `${b.tex}%` }}
                          className={`w-full rounded-t-md ${
                            b.active
                              ? "bg-mint shadow-[0_0_16px_rgba(56,189,248,0.65)]"
                              : "bg-mint/75"
                          }`}
                        />
                        <div
                          style={{ height: `${b.geo}%` }}
                          className="w-full rounded-b-md bg-surface-2 border border-line/60"
                        />
                      </div>
                      <span className="font-mono text-[10px] text-muted">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          4. 6-CARD FEATURE GRID (3×2) (Matches Image 1 middle: "Banking Reimagined...")
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 border-t border-line/60">
        <div className="container-page space-y-12">
          <div className="mx-auto max-w-2xl text-center space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-mint">
              {dict.home.capabilitiesEyebrow}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-fg">
              {dict.home.capabilitiesTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sixFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="os-bento-card p-7 flex flex-col items-center text-center space-y-3"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-mint/30 bg-surface-2 text-mint shadow-inner">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <h3 className="font-display text-base font-bold text-fg">{feat.title}</h3>
                    <span className="rounded-full border border-mint/30 bg-mint/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-mint">
                      {feat.status}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted max-w-xs">{feat.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          5. PRICING PROPOSAL SECTION (Matches Image 1 bottom: "Flexible Plans...")
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 border-t border-line/60">
        <div className="container-page space-y-12">
          <div className="mx-auto max-w-2xl text-center space-y-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-mint">
              {dict.home.pricingEyebrow}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-fg">
              {dict.home.pricingTitle}
            </h2>
            <p className="text-sm text-muted">{dict.home.pricingIntro}</p>

            {/* Pill Switcher Badge (Matches Image 1 Pricing Pill) */}
            <div className="inline-flex items-center gap-1 rounded-full border border-line bg-surface p-1 text-xs">
              <span className="rounded-full bg-mint px-3.5 py-1 font-bold text-bg">
                {dict.pricing.perMonth}
              </span>
              <span className="px-3 py-1 text-muted">{dict.pricing.perOnce}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {dict.pricing.plans.map((p, idx) => {
              const featured = idx === 1 || idx === 2;
              return (
                <div
                  key={p.id}
                  className={
                    featured
                      ? "os-bento-card-featured p-6 sm:p-7 flex flex-col justify-between space-y-6"
                      : "os-bento-card p-6 sm:p-7 flex flex-col justify-between space-y-6"
                  }
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-display text-lg font-bold text-fg">{p.name}</h3>
                      <p className="mt-1 text-xs text-muted">
                        {p.attempts} {dict.pricing.attempts}
                      </p>
                    </div>

                    <div className="flex items-baseline gap-1.5 pt-1">
                      <span className="font-display text-4xl font-bold text-fg">US${p.price}</span>
                      <span className="text-xs text-muted">
                        {p.period === "once" ? dict.pricing.perOnce : dict.pricing.perMonth}
                      </span>
                    </div>

                    <Link
                      href={localePath(locale, "/pricing")}
                      className={
                        featured
                          ? "block w-full rounded-xl bg-mint py-2.5 text-center text-xs font-bold text-bg shadow-[0_0_24px_rgba(56,189,248,0.4)] hover:bg-mint-strong transition-colors"
                          : "block w-full rounded-xl border border-line bg-surface-2/90 py-2.5 text-center text-xs font-semibold text-fg hover:border-mint transition-colors"
                      }
                    >
                      {dict.home.pricingCta}
                    </Link>

                    <ul className="space-y-2.5 pt-2 text-xs text-muted">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          {featured ? (
                            <span
                              className="mt-1 h-2 w-2 shrink-0 rounded-full bg-mint"
                              aria-hidden="true"
                            />
                          ) : (
                            <Check className="h-3.5 w-3.5 shrink-0 text-mint" aria-hidden="true" />
                          )}
                          <span className="text-fg/90">{f}</span>
                        </li>
                      ))}
                      {p.planned.map((pl) => (
                        <li key={pl} className="flex items-start gap-2.5 text-muted">
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-line" />
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
          6. 2-COLUMN FAQ ACCORDION + FINAL CTA (Matches Image 1 bottom: "Your Questions")
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 border-t border-line/60">
        <div className="container-page space-y-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-mint">
                {dict.home.faqEyebrow}
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-fg">
                {dict.home.faqTitle}
              </h2>
              <p className="text-sm text-muted leading-relaxed">{dict.home.finalText}</p>
            </div>

            <div className="lg:col-span-7 space-y-3">
              {dict.home.faqs.map((f, idx) => (
                <details
                  key={f.q}
                  open={idx === 0}
                  className="group os-bento-card px-5 py-4 transition-all"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-sm sm:text-base font-semibold text-fg">
                    <span>
                      {idx + 1}. {f.q}
                    </span>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-mint">
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </summary>
                  <p className="mt-3 border-t border-line/60 pt-3 text-xs sm:text-sm leading-relaxed text-muted">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>

          {/* Final Banner CTA */}
          <div className="os-bento-card-featured p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-fg">
                {dict.home.finalTitle}
              </h2>
              <p className="text-sm text-muted">{dict.home.finalText}</p>
            </div>
            <Link
              href={localePath(locale, "/dashboard/create")}
              className="inline-flex items-center gap-2 rounded-xl bg-mint px-6 py-3.5 text-sm font-bold text-bg shadow-[0_0_28px_rgba(56,189,248,0.45)] hover:bg-mint-strong shrink-0"
            >
              <span>{dict.nav.cta}</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
