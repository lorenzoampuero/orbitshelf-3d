"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale, WebhookDeliveryDto, WebhookEndpointDto } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type Props = { dict: Dictionary; locale: Locale; available: boolean; initialEndpoints: WebhookEndpointDto[]; initialDeliveries: WebhookDeliveryDto[] };

export function WebhooksClient({ dict, locale, available, initialEndpoints, initialDeliveries }: Props) {
  const c = dict.dash.apiAccess.webhooks;
  const [endpoints, setEndpoints] = useState(initialEndpoints);
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const res = await fetch("/api/integrations/webhooks").catch(() => null);
    const body = res?.ok ? await res.json().catch(() => null) : null;
    if (!body) return setError(dict.common.somethingWrong);
    setEndpoints(body.endpoints);
    setDeliveries(body.deliveries);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSecret(null);
    const res = await fetch("/api/integrations/webhooks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) }).catch(() => null);
    const body = res ? await res.json().catch(() => null) : null;
    if (res?.ok && body?.secret) {
      setSecret(body.secret);
      setEndpoints((prev) => [body.endpoint, ...prev]);
      setUrl("");
      return;
    }
    const code = body?.error?.code as keyof typeof c.problems | undefined;
    setError(code && c.problems[code] ? c.problems[code] : dict.common.somethingWrong);
  }

  async function test(id: string) {
    setError(null);
    const res = await fetch(`/api/integrations/webhooks/${encodeURIComponent(id)}`, { method: "POST" }).catch(() => null);
    if (res?.ok) setNotice(c.testQueued);
    else setError(dict.common.somethingWrong);
  }

  async function disable(id: string) {
    setError(null);
    const res = await fetch(`/api/integrations/webhooks/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) await reload();
    else setError(dict.common.somethingWrong);
  }

  const hostOf = (id: string) => endpoints.find((e) => e.id === id)?.url ?? "";

  return (
    <section className="space-y-4 rounded-[var(--radius-card)] border border-line bg-surface-1 p-5 text-xs" data-testid="webhooks">
      <div>
        <h2 className="font-display text-base font-semibold text-fg">{c.title}</h2>
        <p className="mt-1 text-muted">{c.intro}</p>
      </div>

      {!available ? (
        <p className="text-muted" data-testid="webhooks-unavailable">{c.unavailable}</p>
      ) : (
        <form onSubmit={add} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <label htmlFor="webhook-url" className="mb-1.5 block font-medium text-fg">{c.url}</label>
            <input id="webhook-url" type="url" value={url} maxLength={500} onChange={(e) => setUrl(e.target.value)} data-testid="webhook-url" placeholder="https://" className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-sm text-fg" />
          </div>
          <button type="submit" disabled={!url.trim()} data-testid="webhook-add" className="rounded-xl bg-accent px-4 py-2 font-semibold text-bg disabled:opacity-50">{c.add}</button>
        </form>
      )}

      {secret && (
        <div role="status" className="space-y-1 rounded-xl border border-accent/40 bg-bg p-3">
          <p className="font-medium text-fg">{c.secretOnce}</p>
          <code className="block break-all font-mono text-fg" data-testid="webhook-secret">{secret}</code>
        </div>
      )}
      {notice && <p role="status" className="text-accent" data-testid="webhook-notice">{notice}</p>}
      {error && <p role="alert" className="text-danger" data-testid="webhook-error">{error}</p>}

      {endpoints.length === 0 ? (
        <p className="text-muted">{c.empty}</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line" data-testid="webhooks-list">
          {endpoints.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="break-all font-semibold text-fg">{e.url}</div>
                <div className={e.active ? "text-accent" : "text-muted"}>{e.active ? c.active : c.disabled}</div>
              </div>
              {e.active && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => test(e.id)} data-testid="webhook-test" className="rounded-xl border border-line bg-bg px-3 py-1.5 font-medium text-fg hover:border-accent">{c.test}</button>
                  <button type="button" onClick={() => disable(e.id)} data-testid="webhook-disable" className="rounded-xl border border-line bg-bg px-3 py-1.5 font-medium text-danger hover:border-danger">{c.disable}</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div>
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-fg">{c.historyTitle}</h3>
          <button type="button" onClick={reload} data-testid="webhook-refresh" className="rounded-xl border border-line bg-bg px-3 py-1.5 font-medium text-fg hover:border-accent">{c.refresh}</button>
        </div>
        {deliveries.length === 0 ? (
          <p className="mt-2 text-muted">{c.noHistory}</p>
        ) : (
          <ul className="mt-2 divide-y divide-line border-y border-line" data-testid="webhook-deliveries">
            {deliveries.map((d) => (
              <li key={d.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2" data-state={d.state}>
                <div className="min-w-0">
                  <span className="font-mono text-fg">{d.event}</span>
                  <span className="ml-2 break-all text-muted">{hostOf(d.endpointId)}</span>
                  {d.lastError && <div className="text-danger">{d.lastError}</div>}
                </div>
                <div className="text-muted">
                  <span className={d.state === "delivered" ? "text-accent" : d.state === "failed" ? "text-danger" : ""}>{c.states[d.state]}</span> · {c.attempts.replace("{n}", String(d.attempts))} · {formatDate(d.createdAt, locale)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-muted">{c.verify}</p>
    </section>
  );
}
