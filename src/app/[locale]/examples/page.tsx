import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { stat } from "node:fs/promises";
import path from "node:path";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { MarketingShell } from "@/components/marketing-shell";
import { ModelViewerBox } from "@/components/model-viewer-box";
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
    title: dict.meta.examples.title,
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
      <section className="py-14 md:py-24">
        <div className="container-page space-y-14">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">{dict.examples.eyebrow}</span>
            <h1 className="font-display text-4xl font-bold leading-[1.02] md:text-6xl">{dict.examples.title}</h1>
            <p className="text-lg leading-relaxed text-muted">{dict.examples.intro}</p>
          </div>

          {/* Real, approved results: each one beside the photos or the text it came from. Empty until there are some. */}
          {showcase.length > 0 && (
            <ul className="space-y-12">
              {showcase.map((s) => (
                <li key={s.id} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  <div className="space-y-3 lg:col-span-5">
                    <h2 className="font-display text-2xl font-bold">{s.title[locale]}</h2>
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
                  <div className="lg:col-span-7">
                    <ModelViewerBox
                      src={s.glb}
                      alt={s.alt[locale]}
                      heightClass="h-[360px] md:h-[440px]"
                      wheelZoom={false}
                      testId={`showcase-viewer-${s.id}`}
                      {...viewerLabels}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            {dict.examples.items.map((item, idx) => (
              <article key={item.id} className="space-y-4">
                <ModelViewerBox
                  src={`/demo/${item.id}.glb`}
                  alt={item.alt}
                  provenanceBadge={dict.examples.badge}
                  heightClass="h-[300px]"
                  wheelZoom={false}
                  testId={`example-viewer-${item.id}`}
                  {...viewerLabels}
                />
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="font-display text-xl font-bold">{item.name}</h2>
                    {sizes[idx] !== null && (
                      <span className="text-xs text-muted">
                        {dict.examples.sizeLabel}: {formatBytes(sizes[idx] as number)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-muted">{item.text}</p>
                  <a
                    href={`/demo/${item.id}.glb`}
                    download={`${item.id}-demo.glb`}
                    className="btn-pill btn-outline mt-2 px-4 py-2 text-xs text-fg"
                  >
                    {dict.common.download} GLB
                  </a>
                </div>
              </article>
            ))}
          </div>

          <div>
            <Link href={localePath(locale, "/dashboard/create")} className="btn-pill btn-solid">
              {dict.examples.cta}
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
