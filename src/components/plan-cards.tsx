"use client";

import Link from "next/link";
import { useState } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { PLAN_TIERS, type PlanTier } from "@/lib/credits";
import type { Locale } from "@/lib/types";

/** Credits a model takes on a low-cost and on a high-quality engine, worked out on the server from the engine list. */
export type ModelReference = { economy: number; premium: number };

type Copy = Dictionary["pricing"];
type Props = { copy: Copy; locale: Locale; reference: ModelReference; cta?: { href: string; label: string } };

function PlanCard({ tier, plan, copy, locale, reference, cta, divided }: { tier: PlanTier; plan: Copy["plans"][number]; divided: boolean } & Omit<Props, "copy"> & { copy: Copy }) {
  const [index, setIndex] = useState(0);
  const step = tier.steps[index];
  // es-CL groups thousands the same way on the server and in every browser.
  const count = (n: number) => n.toLocaleString(locale === "es" ? "es-CL" : "en-US");
  const credits = `${count(step.credits)} ${copy.credits}`;

  return (
    <div className={`flex flex-col justify-between gap-8 lg:px-7 lg:first:pl-0 lg:last:pr-0 ${divided ? "lg:border-l lg:border-line" : ""}`} data-testid={`plan-${tier.id}`}>
      <div className="space-y-5">
        <h3 className="font-display text-xl font-bold">{plan.name}</h3>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-5xl font-bold leading-none tabular-nums" data-testid={`plan-${tier.id}-price`}>
            US${step.priceUsd}
          </span>
          <span className="text-sm text-muted">{copy.perMonth}</span>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold tabular-nums text-accent" data-testid={`plan-${tier.id}-credits`}>{credits}</p>
          {tier.steps.length > 1 ? (
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
              className="w-full accent-[var(--accent)]"
            />
          ) : (
            <p className="text-xs text-muted">{copy.fixedPlan}</p>
          )}
          <p className="text-xs leading-relaxed text-muted tabular-nums" data-testid={`plan-${tier.id}-models`}>
            {copy.modelsLine.replace("{economy}", count(Math.floor(step.credits / reference.economy))).replace("{premium}", count(Math.floor(step.credits / reference.premium)))}
          </p>
        </div>
        <ul className="space-y-2 text-sm text-muted">
          {plan.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
          {plan.planned.map((p) => (
            <li key={p}>
              {p} ({copy.plannedLabel})
            </li>
          ))}
        </ul>
      </div>
      {cta && (
        <Link href={cta.href} className="btn-pill btn-outline self-start text-fg">
          {cta.label}
        </Link>
      )}
    </div>
  );
}

/** The plans, with a slider on those that can grow. Nothing can be bought from here: payments do not exist yet. */
export function PlanCards({ copy, locale, reference, cta }: Props) {
  return (
    <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-0" data-testid="plan-cards">
      {PLAN_TIERS.map((tier, i) => {
        const plan = copy.plans.find((p) => p.id === tier.id);
        return plan ? <PlanCard key={tier.id} tier={tier} plan={plan} copy={copy} locale={locale} reference={reference} cta={cta} divided={i > 0} /> : null;
      })}
    </div>
  );
}
