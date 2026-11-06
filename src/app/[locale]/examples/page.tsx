import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { stat } from "node:fs/promises";
import path from "node:path";
import { ArrowRight, Box, Image as ImageIcon } from "lucide-react";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { innerPagesCopy, plainTitle } from "@/content/inner-pages";
import { MarketingShell } from "@/components/marketing-shell";
import { ClosingBanner, PageHero, Section, Tile } from "@/components/marketing-kit";
import { ModelViewerBox } from "@/components/model-viewer-box";
import { SampleGallery } from "./sample-gallery";
import { showcase } from "@/config/showcase";
import { formatBytes } from "@/lib/utils";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return buildPageMetadata({
    locale,
    path: "/examples",
    title: plainTitle(dict.meta.examples.title),
    description: dict.meta.examples.description,
  });
}

/** Real size of the shipped sample, read from disk so it can never drift from the file. */
async function sampleBytes(id: string): Promise<number | null> {
  try {
    return (await stat(path.join(process.cwd(), "public", "demo", `${id}.glb`))).size;
  } catch {
    return null;
  }
}

export default async function ExamplesPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();
  const copy = innerPagesCopy[locale];
  const create = localePath(locale, "/dashboard/create");
  const sizes = await Promise.all(dict.examples.items.map((i) => sampleBytes(i.id)));
  const viewerLabels = {
    resetLabel: dict.dash.detail.resetView,
    autoRotateLabel: dict.dash.detail.autoRotate,
    autoRotateOffLabel: dict.dash.detail.autoRotateOff,
    loadingLabel: dict.dash.detail.viewerLoading,
    errorLabel: dict.dash.detail.viewerError,
  };

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <PageHero pill={dict.examples.eyebrow} title={dict.examples.title} text={dict.examples.intro} />

      <Section>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          {/* Real, approved results: each one beside the photos or the text it came from. Empty until there are some. */}
          {showcase.map((s) => (
            <article key={s.id} className="card reveal grid grid-cols-1 gap-6 p-7 md:col-span-6 md:grid-cols-12 md:p-8">
              <div className="space-y-4 md:col-span-5">
                <h2 className="text-2xl font-semibold leading-tight">{s.title[locale]}</h2>
                {s.kind === "text" ? (
                  s.prompt ? <blockquote className="text-lg leading-relaxed">“{s.prompt}”</blockquote> : null
                ) : (
                  <ul className="grid grid-cols-2 gap-3">
                    {s.photos.map((p) => (
                      <li key={p.view} className="space-y-1.5">
                        <Image
                          src={p.src}
                          width={p.width}
                          height={p.height}
                          alt={`${s.title[locale]} · ${dict.dash.create.views[p.view]}`}
                          className="h-auto w-full rounded-xl border border-line"
                          sizes="(min-width: 1024px) 20vw, 45vw"
                        />
                        <span className="block text-xs text-muted">{dict.dash.create.views[p.view]}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-muted">
                  {s.kind === "text" ? dict.home.generatedText : dict.home.generatedPhotos.replace("{n}", String(s.photos.length))}
                </p>
              </div>
              <div className="md:col-span-7">
                <ModelViewerBox
                  src={s.glb}
                  alt={s.alt[locale]}
                  heightClass="h-[360px] md:h-[440px]"
                  wheelZoom={false}
                  testId={`showcase-viewer-${s.id}`}
                  {...viewerLabels}
                />
              </div>
            </article>
          ))}

          {/* Honest empty state: nothing generated has been approved for the public site yet. */}
          {showcase.length === 0 && (
            <article className="card reveal flex flex-col justify-between gap-8 overflow-hidden p-7 md:col-span-6 md:flex-row md:items-center md:p-9">
              <div className="max-w-xl space-y-3">
                <h2 className="text-2xl font-semibold leading-tight">{copy.examples.emptyTitle}</h2>
                <p className="text-sm leading-relaxed text-muted">{copy.examples.emptyText}</p>
                <Link href={create} className="btn-pill btn-solid mt-3">
                  {copy.examples.emptyCta}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <div aria-hidden="true" className="flex items-center gap-3 sm:gap-5">
                <Tile>
                  <ImageIcon className="h-6 w-6" />
                </Tile>
                <ArrowRight className="h-5 w-5 shrink-0 text-accent" />
                <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blood text-white sm:h-20 sm:w-20">
                  <Box className="h-8 w-8" />
                </span>
              </div>
            </article>
          )}

          {/* The samples that ship with the app: one viewer at a time, always labelled as demo, never as results. */}
          <SampleGallery
            samples={dict.examples.items.map((item, idx) => ({
              id: item.id,
              name: item.name,
              text: item.text,
              alt: item.alt,
              size: sizes[idx] !== null ? formatBytes(sizes[idx] as number) : null,
            }))}
            groupLabel={dict.examples.title}
            badge={dict.examples.badge}
            sizeLabel={dict.examples.sizeLabel}
            downloadLabel={`${dict.common.download} GLB`}
            viewerLabels={viewerLabels}
          />
        </div>
      </Section>

      <ClosingBanner
        titleA={copy.examples.closing.titleA}
        titleB={copy.examples.closing.titleB}
        cta={dict.how.cta}
        href={create}
        note={dict.home.finalNote}
      />
    </MarketingShell>
  );
}
