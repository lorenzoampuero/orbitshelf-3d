"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { minPriceForCredits } from "@/lib/credits";

type Props = { c: Dictionary["dash"]["billing"]; engines: { id: string; label: string; credits: number }[] };

/** Shows the price for any amount of credits. There is no way to buy from here: payments do not exist yet. */
export function CreditPicker({ c, engines }: Props) {
  const [credits, setCredits] = useState(800);
  return (
    <section className="space-y-3" aria-labelledby="pick-heading">
      <h2 id="pick-heading" className="font-display text-lg font-semibold">{c.pickTitle}</h2>
      <p className="max-w-3xl text-xs leading-relaxed text-muted">{c.pickNote}</p>
      <label htmlFor="credit-range" className="block text-xs font-medium text-fg">{c.pickCredits}</label>
      <input id="credit-range" type="range" min={100} max={10_000} step={100} value={credits} onChange={(e) => setCredits(Number(e.target.value))} data-testid="credit-range" className="w-full max-w-xl accent-[var(--accent)]" />
      <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <div>
          <dt className="text-xs text-muted">{c.pickCredits}</dt>
          <dd className="font-display text-2xl font-bold tabular-nums text-fg" data-testid="credit-amount">{credits.toLocaleString("en-US")}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{c.pickPrice}</dt>
          <dd className="font-display text-2xl font-bold tabular-nums text-accent" data-testid="credit-price">US${minPriceForCredits(credits).toFixed(2)}</dd>
        </div>
      </dl>
      <div>
        <h3 className="text-xs font-semibold text-fg">{c.pickModels}</h3>
        <ul className="mt-2 grid gap-x-6 gap-y-1 text-xs text-muted sm:grid-cols-2 lg:grid-cols-3">
          {engines.map((e) => (
            <li key={e.id} className="flex justify-between gap-3 border-b border-line py-1">
              <span>{e.label}</span>
              <span className="font-medium tabular-nums text-fg">{Math.floor(credits / e.credits)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
