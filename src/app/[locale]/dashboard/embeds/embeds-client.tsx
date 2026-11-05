"use client";

import { useState } from "react";
import Link from "next/link";
import { localePath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { EmbedDto, Locale, ModelDto } from "@/lib/types";

export function EmbedsClient({ locale, dict, approved, initialEmbeds, origin }: { locale: Locale; dict: Dictionary; approved: ModelDto[]; initialEmbeds: EmbedDto[]; origin: string }) {
  const c = dict.dash.embeds;
  const [embeds, setEmbeds] = useState(initialEmbeds);
  const [modelId, setModelId] = useState(approved[0]?.id ?? "");
  const [domains, setDomains] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const titleOf = (id: string) => approved.find((m) => m.id === id)?.title ?? c.notAvailable;
  const url = (e: EmbedDto) => `${origin}/embed/${e.token}`;
  const snippet = (e: EmbedDto) => `<iframe src="${url(e)}" title="${titleOf(e.modelId).replace(/"/g, "&quot;")}" loading="lazy" style="width:100%;aspect-ratio:1;border:0"></iframe>`;

  async function create(ev: React.FormEvent) {
    ev.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/embeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId, allowedDomains: domains.split(/[\s,]+/).filter(Boolean) }),
      });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.embed) {
        setEmbeds((prev) => [body.embed, ...prev]);
        setDomains("");
      } else {
        setError(body?.error?.code === "invalid_domain" ? c.invalidDomain : body?.error?.code === "not_approved" ? c.notApproved : dict.common.somethingWrong);
      }
    } catch {
      setError(dict.common.networkError);
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    const res = await fetch(`/api/embeds/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) setEmbeds((prev) => prev.map((e) => (e.id === id ? { ...e, active: false } : e)));
    else setError(dict.common.somethingWrong);
  }

  async function copy(e: EmbedDto) {
    await navigator.clipboard.writeText(snippet(e)).catch(() => undefined);
    setCopied(e.id);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[16px] border border-line bg-surface p-5 space-y-4">
        <h2 className="font-display text-base font-semibold text-fg">{c.createTitle}</h2>
        {approved.length === 0 ? (
          <div className="space-y-3 text-xs text-muted">
            <p data-testid="embeds-none-approved">{c.noneApproved}</p>
            <Link href={localePath(locale, "/dashboard/models")} className="inline-flex rounded-xl bg-accent px-4 py-2 font-semibold text-bg hover:bg-accent-strong">
              {c.cta}
            </Link>
          </div>
        ) : (
          <form onSubmit={create} className="space-y-3">
            <div>
              <label htmlFor="embed-model" className="mb-1.5 block text-xs font-medium text-fg">{c.model}</label>
              <select id="embed-model" value={modelId} onChange={(e) => setModelId(e.target.value)} data-testid="embed-model-select" className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-sm text-fg">
                {approved.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="embed-domains" className="mb-1.5 block text-xs font-medium text-fg">{c.domains}</label>
              <input id="embed-domains" value={domains} onChange={(e) => setDomains(e.target.value)} placeholder="mitienda.cl" data-testid="embed-domains-input" className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-sm text-fg" />
              <p className="mt-1 text-xs text-muted">{c.domainsHint}</p>
            </div>
            <button type="submit" disabled={busy || !modelId} data-testid="embed-create-btn" className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-bg disabled:opacity-50">
              {c.create}
            </button>
          </form>
        )}
        {error && <p role="alert" data-testid="embed-error" className="text-xs text-danger">{error}</p>}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-base font-semibold text-fg">{c.listTitle}</h2>
        <p className="text-xs leading-relaxed text-muted">{c.rules}</p>
        {embeds.length === 0 ? (
          <p className="text-xs text-muted">{c.empty}</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line" data-testid="embeds-list">
            {embeds.map((e) => (
              <li key={e.id} className="space-y-2 py-3 text-xs" data-testid={`embed-${e.id}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-fg">{titleOf(e.modelId)}</span>
                    <span className={`ml-2 ${e.active ? "text-accent" : "text-muted"}`}>{e.active ? c.active : c.revoked}</span>
                  </div>
                  {e.active && (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => copy(e)} className="rounded-xl border border-line bg-bg px-3 py-1.5 font-medium text-fg hover:border-accent">
                        {copied === e.id ? c.copied : c.copy}
                      </button>
                      <button type="button" onClick={() => revoke(e.id)} data-testid="embed-revoke-btn" className="rounded-xl border border-line bg-bg px-3 py-1.5 font-medium text-danger hover:border-danger">
                        {c.revoke}
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-muted">{e.allowedDomains.length ? e.allowedDomains.join(", ") : c.anySite}</p>
                {e.active && (
                  <code className="block overflow-x-auto rounded-lg bg-bg p-2 font-mono text-fg" data-testid="embed-snippet">
                    {snippet(e)}
                  </code>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
