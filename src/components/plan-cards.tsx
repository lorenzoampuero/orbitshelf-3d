"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Clock } from "lucide-react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { PLAN_TIERS, type PlanTier } from "@/lib/credits";
import { PRICING_EXTRA } from "@/content/pricing-extra";
import type { Locale } from "@/lib/types";

/** Credits a model takes on a low-cost and on a high-quality engine, worked out on the server from the engine list. */
export type ModelReference = { economy: number; premium: number };

type Copy = Dictionary["pricing"];
/** "marketing" is the public page. "compact" is for narrower hosts such as the dashboard and asks for a wider container before it goes to four columns. */
type Variant = "marketing" | "compact";
type Props = { copy: Copy; locale: Locale; reference: ModelReference; cta?: { href: string; label: string }; variant?: Variant };

/**
 * Whole class strings, so Tailwind can see them. The breakpoints are container queries (the width of the
 * place the cards sit in, not of the screen), so a narrow host such as the dashboard never gets four cramped columns.
 * In four columns each card becomes a subgrid over four shared rows (header, slider, features, button),
 * so every block lines up across the cards.
 */
const LAYOUT: Record<Variant, { grid: string; card: string }> = {
  marketing: {
    grid: "grid grid-cols-1 gap-5 @2xl:grid-cols-2 @5xl:grid-cols-4 @5xl:gap-y-0",
    card: "@5xl:row-span-4 @5xl:grid @5xl:grid-rows-subgrid @5xl:gap-y-0",
  },
  compact: {
    grid: "grid grid-cols-1 gap-4 @2xl:grid-cols-2 @7xl:grid-cols-4 @7xl:gap-y-0",
    card: "@7xl:row-span-4 @7xl:grid @7xl:grid-rows-subgrid @7xl:gap-y-0",
  },
};

function PlanCard({ tier, plan, copy, locale, reference, cta, variant }: { tier: PlanTier; plan: Copy["plans"][number]; copy: Copy; locale: Locale; reference: ModelReference; cta?: Props["cta"]; variant: Variant }) {
  const [index, setIndex] = useState(0);
  const step = tier.steps[index];
  const extra = PRICING_EXTRA[locale];
  const compact = variant === "compact";
  // es-CL groups thousands the same way on the server and in every browser.
  const count = (n: number) => n.toLocaleString(locale === "es" ? "es-CL" : "en-US");
  const credits = `${count(step.credits)} ${copy.credits}`;
  const multi = tier.steps.length > 1;
  const low = Math.floor(step.credits / reference.premium);
  const high = Math.floor(step.credits / reference.economy);
  // With one engine switched on the range collapses to a single number: say "about N", not "between N and N".
  const models = (low === high ? extra.modelsLine.replace("entre {low} y {high}", "unos {low}").replace("about {low} to {high}", "about {low}") : extra.modelsLine)
    .replace("{low}", count(low))
    .replace("{high}", count(high));

  return (
    <div className={`card flex flex-col p-2 ${LAYOUT[variant].card}`} data-testid={`plan-${tier.id}`}>
      <div className={`relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,var(--accent-fill-hi),var(--accent-fill))] text-white ${compact ? "p-4" : "p-5 md:p-6"}`}>
        <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/[0.07]" />
        <div className="relative space-y-4">
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold leading-tight">{plan.name}</h3>
            <p className="text-sm leading-snug text-white/90">{extra.blurbs[tier.id]}</p>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`font-semibold leading-none tabular-nums ${compact ? "text-3xl" : "text-4xl md:text-[2.5rem]"}`} data-testid={`plan-${tier.id}-price`}>
              US${step.priceUsd}
            </span>
            <span className="text-sm text-white/90">{copy.perMonth}</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold tabular-nums" data-testid={`plan-${tier.id}-credits`}>{credits}</p>
            <p className="text-xs leading-relaxed tabular-nums text-white/90" data-testid={`plan-${tier.id}-models`}>{models}</p>
          </div>
        </div>
      </div>

      <div className="px-3 pt-5">
        {multi ? (
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-fg">{extra.sliderTitle}</p>
            <input
              type="range"
              min={0}
              max={tier.steps.length - 1}
              step={1}
              value={index}
              onChange={(e) => setIndex(Number(e.target.value))}
              aria-label={copy.sliderLabel.replace("{plan}", plan.name)}
              aria-valuetext={`US$${step.priceUsd}, ${credits}`}
              data-testid={`plan-${tier.id}-slider`}
              className="block w-full accent-[var(--accent)]"
            />
            <div className="grid grid-cols-5 gap-1">
              {tier.steps.map((s, i) => (
                <button
                  key={s.priceUsd}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-pressed={i === index}
                  aria-label={`US$${s.priceUsd}, ${count(s.credits)} ${copy.credits}`}
                  className={`min-w-0 rounded-full py-1.5 text-center text-xs font-semibold tabular-nums transition-colors ${
                    i === index ? "bg-accent-fill text-white" : "border border-line text-muted hover:border-white/30 hover:text-fg"
                  }`}
                >
                  ${s.priceUsd}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted">{copy.fixedPlan}</p>
        )}
      </div>

      <ul className="flex-1 space-y-2.5 px-3 pb-5 pt-5 text-sm text-muted">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <span>{f}</span>
          </li>
        ))}
        {plan.planned.map((p) => (
          <li key={p} className="flex items-start gap-2.5">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <span>
              {p} ({copy.plannedLabel})
            </span>
          </li>
        ))}
      </ul>

      {cta ? (
        <div className="px-1 pb-1">
          <Link href={cta.href} className="btn-pill btn-ink min-h-12 w-full whitespace-normal text-center">
            {cta.label}
            <span className="sr-only"> ({plan.name})</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}

/** The plans, with a slider (and price chips that follow it) on those that can grow. Nothing can be bought from here: payments do not exist yet. */
export function PlanCards({ copy, locale, reference, cta, variant = "marketing" }: Props) {
  return (
    <div className="@container" data-testid="plan-cards">
      <div className={LAYOUT[variant].grid}>
        {PLAN_TIERS.map((tier) => {
          const plan = copy.plans.find((p) => p.id === tier.id);
          return plan ? <PlanCard key={tier.id} tier={tier} plan={plan} copy={copy} locale={locale} reference={reference} cta={cta} variant={variant} /> : null;
        })}
      </div>
    </div>
  );
}
