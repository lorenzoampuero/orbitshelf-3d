import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo";
import { currentUser } from "@/lib/api";
import { MarketingShell } from "@/components/marketing-shell";
import { ModelViewerBox } from "@/components/model-viewer-box";
import { formatBytes } from "@/lib/utils";

type Props = { params: Promise<{ locale: string }> };

const SAMPLE_SIZES: Record<string, number> = {
  vase: 19072,
  lamp: 11320,
  chair: 2904,
};

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

export default async function ExamplesPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const user = await currentUser();

  return (
    <MarketingShell locale={locale} dict={dict} isSignedIn={Boolean(user)}>
      <section className="py-14 md:py-20">
        <div className="container-page space-y-10">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-mint">
              {dict.examples.eyebrow}
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">{dict.examples.title}</h1>
            <p className="text-base text-muted">{dict.examples.intro}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {dict.examples.items.map((item) => (
              <article
                key={item.id}
                className="flex flex-col justify-between rounded-[16px] border border-line bg-surface p-5 space-y-4"
              >
                <ModelViewerBox
                  src={`/demo/${item.id}.glb`}
                  alt={item.alt}
                  provenanceBadge={dict.examples.badge}
                  resetLabel={dict.dash.detail.resetView}
                  autoRotateLabel={dict.dash.detail.autoRotate}
                  autoRotateOffLabel={dict.dash.detail.autoRotateOff}
                  loadingLabel={dict.dash.detail.viewerLoading}
                  errorLabel={dict.dash.detail.viewerError}
                  heightClass="h-[280px]"
                  testId={`example-viewer-${item.id}`}
                />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-semibold">{item.name}</h2>
                    <span className="text-xs text-muted">
                      {dict.examples.sizeLabel}: {formatBytes(SAMPLE_SIZES[item.id])}
                    </span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{item.text}</p>
                  <div className="pt-2 flex items-center gap-2">
                    <a
                      href={`/demo/${item.id}.glb`}
                      download={`${item.id}-demo.glb`}
                      className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-fg hover:border-mint"
                    >
                      ↓ {dict.common.download} GLB
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div>
            <Link
              href={localePath(locale, "/dashboard/create")}
              className="inline-flex items-center rounded-xl bg-mint px-5 py-3 text-sm font-semibold text-bg"
            >
              {dict.examples.cta}
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
