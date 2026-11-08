"use client";

import { useState } from "react";

export type CheckoutOption = { key: string; priceUsd: number; credits: number };
export type CheckoutGroup = { id: string; name: string; recurring: boolean; options: CheckoutOption[] };
export type CheckoutCopy = { plans: string; packs: string; credits: string; perMonth: string; once: string; button: string; opening: string; error: string };

/** Sends the buyer to Whop. Credits are added by the payment notice that Whop sends afterwards, never by coming back to this page. */
export function CheckoutPanel({ groups, copy }: { groups: CheckoutGroup[]; copy: CheckoutCopy }) {
  const [choice, setChoice] = useState<Record<string, string>>(() => Object.fromEntries(groups.map((g) => [g.id, g.options[0].key])));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function buy(item: string) {
    setBusy(item);
    setError(false);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ item }) });
      const body = (await res.json().catch(() => null)) as { url?: string } | null;
      if (res.ok && body?.url) {
        window.location.assign(body.url);
        return;
      }
      setError(true);
    } catch {
      setError(true);
    }
    setBusy(null);
  }

  const heading = (recurring: boolean) => (recurring ? copy.plans : copy.packs);
  return (
    <div className="space-y-6" data-testid="checkout-panel">
      {[true, false].map((recurring) => {
        const list = groups.filter((g) => g.recurring === recurring);
        if (!list.length) return null;
        return (
          <section key={String(recurring)} aria-label={heading(recurring)}>
            <h3 className="font-display text-sm font-semibold text-fg">{heading(recurring)}</h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {list.map((g) => {
                const selected = g.options.find((o) => o.key === choice[g.id]) ?? g.options[0];
                return (
                  <li key={g.id} className="flex flex-col rounded-[16px] border border-line bg-surface p-4">
                    <p className="text-sm font-semibold text-fg">{g.name}</p>
                    <p className="mt-2 font-display text-2xl font-bold tabular-nums text-fg">
                      US${selected.priceUsd}
                      <span className="ml-1 text-xs font-medium text-muted">{recurring ? copy.perMonth : copy.once}</span>
                    </p>
                    <p className="mt-1 text-xs tabular-nums text-muted">{selected.credits} {copy.credits}</p>
                    {g.options.length > 1 && (
                      <select
                        aria-label={g.name}
                        value={selected.key}
                        onChange={(e) => setChoice((c) => ({ ...c, [g.id]: e.target.value }))}
                        className="mt-3 rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-xs text-fg"
                      >
                        {g.options.map((o) => (
                          <option key={o.key} value={o.key}>
                            US${o.priceUsd} · {o.credits} {copy.credits}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => buy(selected.key)}
                      data-testid={`buy-${g.id}`}
                      className="mt-4 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-bg hover:bg-accent-strong disabled:opacity-60"
                    >
                      {busy === selected.key ? copy.opening : copy.button}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      {error && (
        <p role="alert" className="text-sm text-danger" data-testid="checkout-error">
          {copy.error}
        </p>
      )}
    </div>
  );
}
