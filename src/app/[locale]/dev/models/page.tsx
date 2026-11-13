import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ModelViewerBox } from "@/components/model-viewer-box";
import { ModelStage, ModelThumb, SpinViewer } from "@/components/model";
import { Badge, SpecLine } from "@/components/ui";
import { isLocale } from "@/i18n/config";
import { getModel, models, trisLine } from "@/lib/models";
import { formatBytes } from "@/lib/utils";

export const metadata: Metadata = { title: "Model gallery", robots: { index: false, follow: false } };

/**
 * Control page for the model gallery. Development only. `?model=<slug>` shows one model with its spin sheet and both live GLBs
 * (the Playwright check in scripts opens each slug and waits for the viewer's own "ready" state).
 */
export default async function ModelsDevPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ model?: string; level?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { model: slug, level } = await searchParams;
  const selected = slug ? getModel(slug) : undefined;

  if (selected) {
    const glb = level === "card" ? selected.glb.card : selected.glb.web;
    return (
      <main className="container-page space-y-8 py-10">
        <Link href="/dev/models" className="text-sm text-accent hover:underline">
          ← All models
        </Link>
        <h1 className="text-2xl font-semibold">{selected.name[locale]}</h1>
        <SpecLine
          parts={[trisLine(selected), `${formatBytes(selected.bytes.web)} web`, `${formatBytes(selected.bytes.card)} card`, `${formatBytes(selected.bytes.spin)} spin`, selected.category]}
        />
        <div className="grid gap-8 md:grid-cols-2">
          <ModelStage className="p-6 pb-12">
            <SpinViewer model={selected} locale={locale} />
          </ModelStage>
          <ModelViewerBox src={glb} alt={selected.alt[locale]} heightClass="h-[420px]" testId="dev-model-viewer" />
        </div>
      </main>
    );
  }

  return (
    <main className="container-page space-y-6 py-10">
      <h1 className="text-2xl font-semibold">Model gallery ({models.length})</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
        {models.map((m) => (
          <Link key={m.slug} href={`/dev/models?model=${m.slug}`} className="space-y-2">
            <ModelThumb model={m} locale={locale} caption />
            <div className="flex flex-wrap items-center gap-2 px-1">
              <Badge tone={m.role ? "accent" : "muted"}>{m.role ? "connection" : m.category}</Badge>
              <SpecLine parts={[trisLine(m), formatBytes(m.bytes.web)]} />
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
