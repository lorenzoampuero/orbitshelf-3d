import { Fragment } from "react";
import { ModelSilhouette, type SilhouetteKind } from "@/components/model-silhouette";
import Link from "next/link";
import {
  ArrowRight,
  Armchair,
  Blocks,
  Bot,
  Box,
  Building2,
  Check,
  ClipboardCheck,
  Clock,
  Code2,
  Coins,
  Download,
  Folder,
  Footprints,
  Gamepad2,
  GitCompare,
  Grid3x3,
  Image as ImageIcon,
  Info,
  Lamp,
  Layers,
  Mountain,
  Package,
  PenTool,
  Plug,
  Shirt,
  Star,
  Store,
  Tags,
  Trash2,
  Triangle,
  Type,
  Upload,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import { Card, Checklist, StatusBadge, Tag, Tile } from "@/components/marketing-kit";
import type {
  Feature,
  FlowItem,
  IconKey,
  IntegrationId,
  IntegrationStatus,
  Solution,
  SolutionsCopy,
  Step,
} from "@/content/solutions";

/**
 * Building blocks for the "Who it is for" pages. Server components, drawn with Tiles and CSS only:
 * nothing here is a screenshot or a result, and no number is invented.
 */

const ICONS: Record<IconKey, LucideIcon> = {
  image: ImageIcon,
  type: Type,
  clipboard: ClipboardCheck,
  store: Store,
  triangle: Triangle,
  layers: Layers,
  blocks: Blocks,
  upload: Upload,
  grid: Grid3x3,
  compare: GitCompare,
  download: Download,
  gamepad: Gamepad2,
  pen: PenTool,
  shirt: Shirt,
  armchair: Armchair,
  footprints: Footprints,
  lamp: Lamp,
  building: Building2,
  box: Box,
  package: Package,
  code: Code2,
  coins: Coins,
  plug: Plug,
  bot: Bot,
  webhook: Webhook,
  mountain: Mountain,
};

export function SolutionIcon({ name, className = "h-6 w-6" }: { name: IconKey; className?: string }) {
  const Icon = ICONS[name];
  return <Icon className={className} aria-hidden="true" />;
}

const SPAN: Record<2 | 3 | 4 | 6, string> = {
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  6: "md:col-span-6",
};

/** A flat drawing of a demo model: what stands for "a 3D model" in the diagrams on these pages. */
function ModelTile({ size = "lg", kind = "vase" }: { size?: "md" | "lg"; kind?: SilhouetteKind }) {
  return <ModelSilhouette kind={kind} className={size === "lg" ? "h-20 w-20" : "h-14 w-14"} />;
}

function Arrow({ className = "" }: { className?: string }) {
  return <ArrowRight className={`h-5 w-5 shrink-0 text-accent ${className}`} aria-hidden="true" />;
}

/** The drawn strip under the hero: what goes in, what you check, what comes out. */
export function HeroFlow({ items, kind = "vase" }: { items: FlowItem[]; kind?: SilhouetteKind }) {
  return (
    <div
      aria-hidden="true"
      className="card mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-6 p-8 sm:gap-x-5 md:p-10"
    >
      {items.map((it, i) => (
        <Fragment key={it.label}>
          {i > 0 ? <Arrow className="hidden sm:block" /> : null}
          {it.result ? (
            <span className="flex flex-col items-center gap-1.5">
              <ModelTile kind={kind} />
              <span className="text-xs text-muted">{it.label}</span>
            </span>
          ) : (
            <Tile label={it.label}>
              <SolutionIcon name={it.icon} />
            </Tile>
          )}
        </Fragment>
      ))}
    </div>
  );
}

/** Small icon-only version of the flow, for the cards on the index. */
export function MiniFlow({ items }: { items: FlowItem[] }) {
  return (
    <div aria-hidden="true" className="flex flex-wrap items-center gap-2">
      {items.map((it, i) => (
        <Fragment key={it.label}>
          {i > 0 ? <ArrowRight className="h-4 w-4 shrink-0 text-accent" /> : null}
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${it.result ? "bg-blood text-white" : "border border-line bg-surface-2 text-fg"}`}
          >
            <SolutionIcon name={it.icon} className="h-5 w-5" />
          </span>
        </Fragment>
      ))}
    </div>
  );
}

/** Four steps in one card, each with a drawn tile and a dashed connector on desktop. */
export function Workflow({ steps }: { steps: Step[] }) {
  return (
    <ol className="card reveal grid grid-cols-1 gap-10 p-7 md:grid-cols-4 md:gap-6 md:p-10">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={s.title} className="flex flex-col gap-5">
            <div aria-hidden="true" className="flex items-center gap-3">
              <Tile tone={last ? "blood" : "dark"}>
                <SolutionIcon name={s.icon} />
              </Tile>
              {last ? null : <span className="hidden h-px flex-1 border-t border-dashed border-white/25 md:block" />}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold tabular-nums text-accent">{`0${i + 1}`}</p>
              <h3 className="text-lg font-semibold leading-tight">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{s.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

type Visuals = SolutionsCopy["visual"];

function FeatureVisual({ feature, labels, kind }: { feature: Feature; labels: Visuals; kind: SilhouetteKind }) {
  switch (feature.visual) {
    case "views":
      return (
        <div aria-hidden="true" className="flex flex-wrap items-center gap-x-3 gap-y-4">
          {([labels.views.front, labels.views.left, labels.views.back, labels.views.right] as const).map((l) => (
            <Tile key={l} label={l}>
              <ImageIcon className="h-6 w-6" />
            </Tile>
          ))}
          <Arrow className="hidden sm:block" />
          <span className="flex flex-col items-center gap-1.5">
            <ModelTile size="md" kind={kind} />
            <span className="text-xs text-muted">{labels.model}</span>
          </span>
        </div>
      );
    case "textToModel":
      return (
        <div aria-hidden="true" className="flex items-center gap-3">
          <Tile label={labels.text}>
            <Type className="h-6 w-6" />
          </Tile>
          <Arrow />
          <span className="flex flex-col items-center gap-1.5">
            <ModelTile size="md" kind={kind} />
            <span className="text-xs text-muted">{labels.model}</span>
          </span>
        </div>
      );
    case "review":
      return (
        <div aria-hidden="true" className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="flex h-8 w-8 items-center justify-center rounded-lg bg-blood text-white">
              <Check className="h-4 w-4" />
            </span>
          ))}
        </div>
      );
    case "versions":
      return (
        <div aria-hidden="true" className="flex items-center gap-3">
          <Tile label={labels.original}>
            <Box className="h-6 w-6" />
          </Tile>
          <Arrow />
          <Tile tone="blood" label={labels.optimized}>
            <Layers className="h-6 w-6" />
          </Tile>
        </div>
      );
    case "formats":
      return (
        <ul aria-hidden="true" className="flex flex-wrap gap-3">
          {labels.formats.map((f) => (
            <li key={f.name} className="rounded-2xl border border-line bg-surface-2 px-4 py-3">
              <span className="block text-base font-semibold text-fg">{f.name}</span>
              <span className="block text-xs text-fg/80">{f.note}</span>
            </li>
          ))}
        </ul>
      );
    case "metrics":
      return (
        <ul aria-hidden="true" className="flex flex-wrap gap-2">
          {labels.metrics.map((m) => (
            <li key={m} className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs text-fg">
              {m}
            </li>
          ))}
        </ul>
      );
    case "projects":
      return (
        <div aria-hidden="true" className="flex flex-wrap items-center gap-x-3 gap-y-4">
          <Tile label={labels.projects.projects}>
            <Folder className="h-6 w-6" />
          </Tile>
          <Tile label={labels.projects.tags}>
            <Tags className="h-6 w-6" />
          </Tile>
          <Tile label={labels.projects.favorites}>
            <Star className="h-6 w-6" />
          </Tile>
          <Tile label={labels.projects.trash}>
            <Trash2 className="h-6 w-6" />
          </Tile>
        </div>
      );
    case "chain":
      return (
        <div aria-hidden="true" className="flex flex-wrap items-center gap-x-3 gap-y-4">
          {(feature.chain ?? []).map((c, i, all) => (
            <Fragment key={c.label}>
              {i > 0 ? <Arrow className="hidden sm:block" /> : null}
              <Tile tone={i === all.length - 1 ? "blood" : "dark"} label={c.label}>
                <SolutionIcon name={c.icon} />
              </Tile>
            </Fragment>
          ))}
        </div>
      );
    default:
      return null;
  }
}

function FeatureCard({ feature, viewer, labels, kind }: { feature: Feature; viewer?: React.ReactNode; labels: Visuals; kind: SilhouetteKind }) {
  const big = feature.span >= 4;
  const head = (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <Tag>{feature.tag}</Tag>
        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-fg">
          <SolutionIcon name={feature.icon} className="h-5 w-5" />
        </span>
      </div>
      <h3 className={`${big ? "max-w-md text-2xl" : "text-xl"} font-semibold leading-tight`}>{feature.title}</h3>
      <p className="max-w-md text-sm leading-relaxed text-muted">{feature.text}</p>
      {feature.points ? <Checklist items={feature.points} /> : null}
      {feature.note ? (
        <p className="max-w-md border-l-2 border-accent pl-3 text-xs leading-relaxed text-muted">{feature.note}</p>
      ) : null}
    </div>
  );

  if (feature.visual === "viewer") {
    return (
      <Card tone="red" className={`${SPAN[feature.span]} grid grid-cols-1 gap-6 overflow-hidden md:grid-cols-2`}>
        {head}
        <div className="space-y-2 self-center">{viewer}</div>
      </Card>
    );
  }

  return (
    <Card
      lift
      className={`${SPAN[feature.span]} flex flex-col justify-between gap-8 overflow-hidden ${feature.span === 6 ? "md:flex-row md:items-center" : ""}`}
    >
      {head}
      <FeatureVisual feature={feature} labels={labels} kind={kind} />
    </Card>
  );
}

/** Mixed-size bento. Each row of `items` adds up to 6 columns. */
export function FeatureBento({
  items,
  viewer,
  labels,
  kind = "vase",
}: {
  items: Feature[];
  viewer?: React.ReactNode;
  labels: Visuals;
  kind?: SilhouetteKind;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
      {items.map((f) => (
        <FeatureCard key={f.tag} feature={f} viewer={viewer} labels={labels} kind={kind} />
      ))}
    </div>
  );
}

/** The honest-limits card pair: hard cases on the left, what is not available on the right. */
export function ExpectBlock({ expect }: { expect: Solution["expect"] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
      <Card tone="outline" className="space-y-5 md:col-span-4">
        <h3 className="text-xl font-semibold leading-tight">{expect.hardTitle}</h3>
        <ul className="space-y-3 text-sm leading-relaxed text-muted">
          {expect.hard.map((h) => (
            <li key={h} className="flex items-start gap-2.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
              {h}
            </li>
          ))}
        </ul>
      </Card>
      <Card tone="planned" className="space-y-5 md:col-span-2">
        <h3 className="text-xl font-semibold leading-tight">{expect.missingTitle}</h3>
        <ul className="space-y-3 text-sm leading-relaxed text-muted">
          {expect.missing.map((m) => (
            <li key={m} className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              {m}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

const STATUS_TONE: Record<IntegrationStatus, "ok" | "warn" | "muted"> = {
  available: "ok",
  testing: "warn",
  soon: "muted",
  planned: "muted",
};

/** Badge for an integration status, with the label in the page language. */
export function IntegrationBadge({ status, labels }: { status: IntegrationStatus; labels: SolutionsCopy["statusLabels"] }) {
  return <StatusBadge tone={STATUS_TONE[status]}>{labels[status]}</StatusBadge>;
}

/** The integrations that apply to a trade, each with its honest status. */
export function IntegrationsBlock({
  items,
  copy,
  seeAllHref,
  seeAllLabel,
}: {
  items: { id: IntegrationId; span: 2 | 3 | 4 }[];
  copy: SolutionsCopy;
  seeAllHref: string;
  seeAllLabel: string;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
        {items.map(({ id, span }) => {
          const it = copy.integrations[id];
          return (
            <Card
              key={id}
              lift
              tone={it.status === "available" || it.status === "testing" ? "default" : "planned"}
              className={`${SPAN[span]} flex flex-col gap-5`}
            >
              <div className="flex items-start justify-between gap-3">
                <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-fg">
                  <SolutionIcon name={it.icon} className="h-5 w-5" />
                </span>
                <IntegrationBadge status={it.status} labels={copy.statusLabels} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold leading-tight">{it.name}</h3>
                <p className="text-sm leading-relaxed text-muted">{it.text}</p>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="flex justify-center">
        <Link href={seeAllHref} className="btn-pill btn-outline">
          {seeAllLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
