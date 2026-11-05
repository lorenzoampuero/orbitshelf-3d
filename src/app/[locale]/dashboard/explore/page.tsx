import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { PRESETS } from "@/lib/glb-presets";
import { refreshEngineSwitches } from "@/lib/jobs";
import { allEngines, availableEngines, toEngineDto } from "@/lib/provider/registry";
import { buildPageMetadata } from "@/lib/seo";
import { OPTIMIZE_PRESETS } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return buildPageMetadata({ locale, path: "/dashboard/explore", title: t.dash.explore.title, description: t.dash.explore.subtitle, noIndex: true });
}

/** Every tool and engine, whatever the profile. An engine that has not been validated says so here instead of disappearing. */
export default async function ExplorePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const c = dict.dash.explore;
  await refreshEngineSwitches().catch(() => undefined);
  const available = new Set(availableEngines().map((e) => e.id));
  const engines = allEngines().map(toEngineDto);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">{c.title}</h1>
        <p className="mt-1 text-sm text-muted">{c.subtitle}</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{c.toolsTitle}</h2>
        <ul className="divide-y divide-line border-y border-line">
          {c.tools.map((tool) => (
            <li key={tool.href}>
              <Link href={localePath(locale, tool.href)} data-testid={`explore-tool-${tool.id}`} className="group grid gap-1 py-3 text-sm md:grid-cols-12 md:gap-6">
                <span className="font-semibold text-fg group-hover:text-accent md:col-span-4">{tool.title}</span>
                <span className="text-xs leading-relaxed text-muted md:col-span-8">{tool.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{c.enginesTitle}</h2>
        <p className="max-w-3xl text-xs leading-relaxed text-muted">{c.enginesNote}</p>
        <div className="overflow-x-auto" role="region" aria-label={c.enginesTitle} tabIndex={0}>
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="border-b border-line text-muted">
              <tr>
                <th scope="col" className="py-2 pr-4 font-medium">{c.columns.engine}</th>
                <th scope="col" className="py-2 pr-4 font-medium">{c.columns.status}</th>
                <th scope="col" className="py-2 pr-4 font-medium">{c.columns.modes}</th>
                <th scope="col" className="py-2 pr-4 font-medium">{c.columns.photos}</th>
                <th scope="col" className="py-2 pr-4 font-medium">{c.columns.formats}</th>
                <th scope="col" className="py-2 font-medium">{c.columns.price}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {engines.map((e) => (
                <tr key={e.id} data-testid={`explore-engine-${e.id}`}>
                  <th scope="row" className="py-2.5 pr-4 font-semibold text-fg">{e.label}</th>
                  <td className={`py-2.5 pr-4 ${available.has(e.id) ? "text-accent" : "text-muted"}`} data-testid={`explore-engine-status-${e.id}`}>
                    {available.has(e.id) ? c.available : c.unavailable}
                  </td>
                  <td className="py-2.5 pr-4 text-muted">{e.modes.map((m) => dict.dash.inputKind[m]).join(", ")}</td>
                  <td className="py-2.5 pr-4 tabular-nums text-muted">{e.maxPhotos}</td>
                  <td className="py-2.5 pr-4 uppercase text-muted">{e.exports.join(", ")}</td>
                  <td className="py-2.5 tabular-nums text-muted">
                    {c.priceFrom.replace("{usd}", e.fromPriceUsd.toFixed(2))} · {e.priceVerifiedAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{c.limitsTitle}</h2>
        <p className="max-w-3xl text-xs leading-relaxed text-muted">{dict.dash.tools.presetsNote}</p>
        <ul className="divide-y divide-line border-y border-line text-xs">
          {OPTIMIZE_PRESETS.map((p) => (
            <li key={p} className="flex flex-wrap justify-between gap-3 py-2.5">
              <span className="font-semibold text-fg">{dict.dash.tools.presets[p]}</span>
              <span className="tabular-nums text-muted">
                {PRESETS[p].maxTriangles.toLocaleString("en-US")} {dict.dash.tools.checks.triangles} · {PRESETS[p].maxTextureSize} px · {formatBytes(PRESETS[p].maxBytes)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
