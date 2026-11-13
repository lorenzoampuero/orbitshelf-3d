import { ArrowRight, Box, Code2, Plug, ShoppingCart, Webhook } from "lucide-react";
import Link from "next/link";
import { ArtImage } from "@/components/home/art-image";
import { ModelStage } from "@/components/model";
import { Badge } from "@/components/ui";
import type { HomeCopy } from "@/content/home-copy";
import type { GalleryModel } from "@/lib/models";
import type { Locale } from "@/lib/types";

type Int = { key: string; name: string; status: string; text: string };

const SMALL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = { embed: Code2, api: Webhook, mcp: Plug, woo: ShoppingCart };
const tone = (status: string) => (status === "available" ? "ok" : status === "testing" ? "warn" : "muted");

/**
 * The connections section. The three connection models (Shopify, Unity, Blender) stand for tools that read the files;
 * each shows the status it really has. Roblox Studio and direct printing are shown only as "coming soon".
 */
export function ConnectionsBand({
  ints,
  statusLabels,
  copy,
  models,
  locale,
  allHref,
  allLabel,
}: {
  ints: Int[];
  statusLabels: Record<string, string>;
  copy: HomeCopy["connections"];
  /** Keyed by the integration they stand for: shopify, blender, engines. */
  models: Record<string, GalleryModel>;
  locale: Locale;
  allHref: string;
  allLabel: string;
}) {
  const featured = ["shopify", "blender", "engines"].map((key) => ({ int: ints.find((i) => i.key === key), model: models[key] })).filter((x): x is { int: Int; model: GalleryModel } => Boolean(x.int && x.model));
  const small = ints.filter((i) => i.key in SMALL_ICONS);

  return (
    <div className="space-y-6">
      <ul aria-label={copy.reads} className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {featured.map(({ int, model }) => (
          <li key={int.key} className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface-1" data-testid={`connection-${int.key}`}>
            <ModelStage ring={false} className="aspect-[16/10] rounded-none">
              <ArtImage image={model.beauty} alt={model.alt[locale]} sizes="(min-width: 768px) 360px, 92vw" className="absolute inset-0 h-full w-full object-contain p-[10%]" />
            </ModelStage>
            <div className="space-y-2 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold leading-tight">{int.name}</h3>
                <Badge tone={tone(int.status)}>{statusLabels[int.status]}</Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted">{int.text}</p>
            </div>
          </li>
        ))}
      </ul>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {small.map((int) => {
          const Icon = SMALL_ICONS[int.key] ?? Box;
          return (
            <li key={int.key} className={`space-y-3 rounded-[var(--radius-card)] border p-5 ${int.status === "planned" || int.status === "later" ? "border-dashed border-line-strong" : "border-line bg-surface-1"}`}>
              <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-3 text-fg">
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold leading-tight">{int.name}</h3>
                <Badge tone={tone(int.status)}>{statusLabels[int.status]}</Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted">{int.text}</p>
            </li>
          );
        })}
      </ul>

      <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h3 className="text-base font-semibold">{copy.next}</h3>
          <p className="text-sm text-muted">{copy.nextSub}</p>
        </div>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[copy.roblox, copy.print].map((item) => (
            <li key={item.name} className="flex items-center justify-between gap-4 rounded-2xl bg-surface-1 px-4 py-3">
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{item.name}</span>
                <span className="block text-[13px] leading-snug text-muted">{item.text}</span>
              </span>
              <Badge tone="muted" className="shrink-0">
                {copy.soon}
              </Badge>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-center">
        <Link href={allHref} className="btn-pill btn-outline">
          {allLabel}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
