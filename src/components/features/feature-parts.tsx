import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Armchair,
  Ban,
  Box,
  Camera,
  Eye,
  Focus,
  Footprints,
  Gamepad2,
  Image as ImageIcon,
  Lamp,
  Layers,
  Package,
  Palette,
  Ruler,
  RotateCw,
  Shirt,
  Sparkles,
  Square,
  Store,
  Sun,
  Type,
  type LucideIcon,
} from "lucide-react";
import { Card, Tag, Tile } from "@/components/marketing-kit";
import { ModelSilhouette, type SilhouetteKind } from "@/components/model-silhouette";
import type { Aside, CommonCopy, FeatureCopy, IconKey } from "@/content/features";
import { localePath } from "@/i18n/config";
import type { Locale } from "@/lib/types";

/**
 * Pieces shared by /features and /features/[slug]. Server components only.
 * Everything drawn here is a diagram, never a screenshot or a result.
 */

const ICONS: Record<IconKey, LucideIcon> = {
  image: ImageIcon,
  type: Type,
  box: Box,
  focus: Focus,
  square: Square,
  sun: Sun,
  shirt: Shirt,
  camera: Camera,
  armchair: Armchair,
  footprints: Footprints,
  lamp: Lamp,
  package: Package,
  sparkles: Sparkles,
  eye: Eye,
  ruler: Ruler,
  palette: Palette,
  layers: Layers,
  gamepad: Gamepad2,
  ban: Ban,
  rotate: RotateCw,
  store: Store,
};

export function FeatureIcon({ name, className = "h-6 w-6" }: { name: IconKey; className?: string }) {
  const Icon = ICONS[name];
  return <Icon className={className} aria-hidden="true" />;
}

/** Which demo drawing stands for the result on a mode page, from the demo GLB that page shows. */
export function demoKind(src: string): SilhouetteKind {
  return src.includes("lamp") ? "lamp" : src.includes("chair") ? "chair" : "vase";
}

/** Inputs as tiles, an arrow, and the model as a flat drawing of a demo model. Wraps on narrow screens instead of overflowing. */
export function FlowDiagram({
  inputs,
  outputLabel,
  kind = "vase",
}: {
  inputs: { icon: IconKey; label: string }[];
  outputLabel: string;
  kind?: SilhouetteKind;
}) {
  return (
    <div aria-hidden="true" className="flex flex-wrap items-center gap-x-4 gap-y-5">
      <div className="flex flex-wrap gap-2 sm:gap-4">
        {inputs.map((i) => (
          <Tile key={i.label} label={i.label}>
            <FeatureIcon name={i.icon} />
          </Tile>
        ))}
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-accent" />
      <span className="flex flex-col items-center gap-1.5">
        <ModelSilhouette kind={kind} className="h-20 w-20 sm:h-24 sm:w-24" />
        <span className="text-xs text-muted">{outputLabel}</span>
      </span>
    </div>
  );
}

/** The card that sits above the tips: example descriptions, subjects to pick, or what to keep constant. */
export function AsideCard({ aside }: { aside: Aside }) {
  return (
    <Card className="grid grid-cols-1 gap-8 md:col-span-6 md:grid-cols-2 md:gap-10">
      <div className="space-y-4">
        <Tag>{aside.tag}</Tag>
        <h3 className="text-2xl font-semibold leading-tight">{aside.title}</h3>
        <p className="max-w-md text-sm leading-relaxed text-muted">{aside.text}</p>
      </div>

      {aside.kind === "prompts" ? (
        <ul className="space-y-4">
          {aside.pairs.map((p) => (
            <li key={p.weak} className="space-y-2 rounded-2xl border border-line bg-surface-2 p-4">
              <p className="text-sm text-muted">
                <span className="mr-2 font-semibold text-fg">{aside.weakLabel}</span>
                {p.weak}
              </p>
              <p className="text-sm leading-relaxed text-muted">
                <span className="mr-2 font-semibold text-accent">{aside.betterLabel}</span>
                {p.better}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {aside.kind === "subjects" ? (
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold">{aside.easierLabel}</p>
            <ul className="flex flex-wrap gap-4">
              {aside.easier.map((i) => (
                <li key={i.label} className="max-w-[7rem] text-center">
                  <Tile label={i.label}>
                    <FeatureIcon name={i.icon} />
                  </Tile>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold">{aside.harderLabel}</p>
            <ul className="flex flex-wrap gap-4">
              {aside.harder.map((i) => (
                <li key={i.label} className="max-w-[7rem] text-center">
                  <Tile label={i.label}>
                    <FeatureIcon name={i.icon} />
                  </Tile>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {aside.kind === "constants" ? (
        <div className="space-y-5">
          <ul className="flex flex-wrap gap-4">
            {aside.items.map((i) => (
              <li key={i.label} className="max-w-[7rem] text-center">
                <Tile label={i.label}>
                  <FeatureIcon name={i.icon} />
                </Tile>
              </li>
            ))}
          </ul>
          <p className="text-sm leading-relaxed text-muted">{aside.note}</p>
        </div>
      ) : null}
    </Card>
  );
}

/** Column spans for six tips in a 6-column grid: 4+2, 2+4, 3+3. */
export const TIP_SPANS = ["md:col-span-4", "md:col-span-2", "md:col-span-2", "md:col-span-4", "md:col-span-3", "md:col-span-3"];

export function TipCard({ tip, span }: { tip: FeatureCopy["tips"][number]; span: string }) {
  return (
    <Card lift className={`space-y-4 ${span}`}>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-fg">
        <FeatureIcon name={tip.icon} className="h-5 w-5" />
      </span>
      <h3 className="text-lg font-semibold leading-tight">{tip.title}</h3>
      <p className="text-sm leading-relaxed text-muted">{tip.text}</p>
    </Card>
  );
}

/** A mode shown as a link card: used for "other ways to create" and for the index comparison. */
export function ModeLinkCard({
  locale,
  slug,
  copy,
  common,
  title,
  className = "",
}: {
  locale: Locale;
  slug: string;
  copy: FeatureCopy;
  common: CommonCopy;
  title: string;
  className?: string;
}) {
  return (
    <Card lift className={`flex flex-col justify-between gap-6 ${className}`}>
      <div className="space-y-4">
        <Tag>{copy.card.tag}</Tag>
        <h3 className="text-xl font-semibold leading-tight">{title}</h3>
        <p className="text-sm leading-relaxed text-muted">{copy.card.line}</p>
      </div>
      <Link href={localePath(locale, `/features/${slug}`)} className="btn-pill btn-outline max-w-full self-start !whitespace-normal text-center">
        {common.seeMode.replace("{title}", title)}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </Card>
  );
}

/** One card with three links: stores, games, design. */
export function SolutionsRow({ locale, common }: { locale: Locale; common: CommonCopy }) {
  return (
    <ul className="card reveal grid grid-cols-1 divide-y divide-line overflow-hidden sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {common.solutions.map((s) => (
        <li key={s.path}>
          <Link
            href={localePath(locale, s.path)}
            className="group flex h-full items-start justify-between gap-4 p-6 transition-colors hover:bg-white/5 md:p-7"
          >
            <span className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-fg">
                <FeatureIcon name={s.icon} className="h-5 w-5" />
              </span>
              <span className="space-y-1">
                <span className="block text-base font-semibold">{s.label}</span>
                <span className="block text-sm leading-relaxed text-muted">{s.desc}</span>
              </span>
            </span>
            <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-accent transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Diagnostics as small chips. */
export function Chips({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((d) => (
        <li key={d} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-muted">
          {d}
        </li>
      ))}
    </ul>
  );
}
