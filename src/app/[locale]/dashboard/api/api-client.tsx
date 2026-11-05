"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import { API_SCOPES, type ApiScope, type ApiTokenDto, type Locale } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function ApiClient({ dict, initial, locale }: { dict: Dictionary; initial: ApiTokenDto[]; locale: Locale }) {
  const c = dict.dash.apiAccess;
  const [tokens, setTokens] = useState(initial);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<ApiScope[]>(["assets:read"]);
  const [created, setCreated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreated(null);
    const res = await fetch("/api/tokens", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, scopes }) }).catch(() => null);
    const body = res ? await res.json().catch(() => null) : null;
    if (res?.ok && body?.token) {
      setCreated(body.token);
      setTokens((prev) => [body.record, ...prev]);
      setName("");
    } else {
      setError(c.createFailed);
    }
  }

  async function revoke(id: string) {
    const res = await fetch(`/api/tokens/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) setTokens((prev) => prev.map((t) => (t.id === id ? { ...t, active: false } : t)));
    else setError(dict.common.somethingWrong);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[16px] border border-line bg-surface p-5 space-y-4 text-xs">
        <h2 className="font-display text-base font-semibold text-fg">{c.createTitle}</h2>
        <form onSubmit={create} className="space-y-3">
          <div>
            <label htmlFor="token-name" className="mb-1.5 block font-medium text-fg">{c.name}</label>
            <input id="token-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} data-testid="token-name" className="w-full rounded-xl border border-line bg-bg px-3.5 py-2 text-sm text-fg" />
          </div>
          <fieldset className="space-y-2">
            <legend className="font-medium text-fg">{c.permissions}</legend>
            {API_SCOPES.map((s) => (
              <label key={s} className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={scopes.includes(s)}
                  onChange={(e) => setScopes((prev) => (e.target.checked ? [...prev, s] : prev.filter((x) => x !== s)))}
                  data-testid={`token-scope-${s.replace(":", "-")}`}
                  className="mt-0.5"
                />
                <span className="text-muted"><code className="font-mono text-fg">{s}</code>: {c.scopes[s]}</span>
              </label>
            ))}
          </fieldset>
          <button type="submit" disabled={!name.trim() || scopes.length === 0} data-testid="token-create" className="rounded-xl bg-accent px-4 py-2 font-semibold text-bg disabled:opacity-50">{c.create}</button>
        </form>
        {created && (
          <div role="status" className="space-y-1 rounded-xl border border-accent/40 bg-bg p-3">
            <p className="font-medium text-fg">{c.showOnce}</p>
            <code className="block break-all font-mono text-fg" data-testid="token-value">{created}</code>
          </div>
        )}
        {error && <p role="alert" className="text-danger">{error}</p>}
      </section>

      <section className="space-y-3 text-xs">
        <h2 className="font-display text-base font-semibold text-fg">{c.listTitle}</h2>
        {tokens.length === 0 ? (
          <p className="text-muted">{c.empty}</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line" data-testid="tokens-list">
            {tokens.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <div className="font-semibold text-fg">{t.name} <span className={t.active ? "ml-2 font-medium text-accent" : "ml-2 font-medium text-muted"}>{t.active ? c.active : c.revoked}</span></div>
                  <div className="text-muted"><code className="font-mono">{t.prefix}…</code> · {t.scopes.join(", ")} · {t.lastUsedAt ? c.lastUsed.replace("{date}", formatDate(t.lastUsedAt, locale)) : c.neverUsed}</div>
                </div>
                {t.active && (
                  <button type="button" onClick={() => revoke(t.id)} data-testid="token-revoke" className="rounded-xl border border-line bg-bg px-3 py-1.5 font-medium text-danger hover:border-danger">{c.revoke}</button>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="text-muted">{c.docs}</p>
      </section>
    </div>
  );
}
