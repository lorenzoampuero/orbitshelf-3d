import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { examplePoster } from "@/content/examples";
import { isLocale, localePath } from "@/i18n/config";
import { forBilling } from "@/i18n/billing-copy";
import { getDictionary } from "@/i18n/get-dictionary";
import { billingUnit } from "@/lib/env";
import { PRESETS } from "@/lib/glb-presets";
import { refreshEngineSwitches } from "@/lib/jobs";
import { allEngines, availableEngines, toEngineDto } from "@/lib/provider/registry";
import { buildPageMetadata } from "@/lib/seo";
import { OPTIMIZE_PRESETS } from "@/lib/types";
import { cn, formatBytes } from "@/lib/utils";

/** Pictures for the tool tiles: renders of the free example models, never results of the service. */
const TOOL_ART = [
  { id: "marble_bust_01", mesh: false },
  { id: "lantern_01", mesh: true },
  { id: "camera_01", mesh: false },
  { id: "mid_century_lounge_chair", mesh: false },
  { id: "horse_statue_01", mesh: true },
  { id: "wooden_crate_01", mesh: false },
];

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
  const dict = forBilling(getDictionary(locale), locale, billingUnit());
  const c = dict.dash.explore;
  await refreshEngineSwitches().catch(() => undefined);
  const available = new Set(availableEngines().map((e) => e.id));
  const engines = allEngines().map(toEngineDto);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{c.title}</h1>
        <p className="mt-1 text-sm text-muted">{c.subtitle}</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{c.toolsTitle}</h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {c.tools.map((tool, i) => {
            const art = TOOL_ART[i % TOOL_ART.length];
            return (
              <li key={tool.id} className={cn(i === 0 && "col-span-2 md:row-span-2", (i === 3 || i === 4 || i === 5) && "md:col-span-2")}>
                <Link
                  href={localePath(locale, tool.href)}
                  data-testid={`explore-tool-${tool.id}`}
                  className="card-lift group flex h-full flex-col overflow-hidden rounded-[24px] border border-line bg-surface p-3"
                >
                  <span className="relative block min-h-[150px] flex-1">
                    <Image src={examplePoster(art.id, art.mesh)} alt="" fill sizes="(min-width: 768px) 25vw, 50vw" unoptimized className="object-contain p-2" />
                  </span>
                  <span className="block rounded-2xl bg-bg/85 px-3 py-2.5">
                    <span className="block text-sm font-semibold text-fg group-hover:text-accent">{tool.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">{tool.text}</span>
                  </span>
                </Link>
              </li>
            );
          })}
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
                    {c.priceFrom.replace("{n}", String(e.fromCredits))} · {e.priceVerifiedAt}
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
