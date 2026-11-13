"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy, KeyRound, Lock } from "lucide-react";
import { agentsCopy, type AgentClientId, type AgentToolName } from "@/content/agents-copy";
import type { ApiScope, Locale } from "@/lib/types";
import { cn } from "@/lib/utils";

type ToolInfo = { name: AgentToolName; scope: ApiScope; spends: boolean };

const CLIENT_ORDER: AgentClientId[] = ["claude-code", "cursor", "vscode", "desktop", "cli"];
/** What the one-click token can do: read, and ask for quotes. It cannot start a paid job by itself. */
const MCP_TOKEN_SCOPES: ApiScope[] = ["models:read", "assets:read", "credits:read", "jobs:write"];

const json = (value: unknown) => JSON.stringify(value, null, 2);

/** The text to paste into each client. `url` and `token` are exactly what the server expects. */
function snippetFor(client: AgentClientId, url: string, token: string): string {
  const bearer = `Bearer ${token}`;
  switch (client) {
    case "claude-code":
      return `claude mcp add --transport http orbitshelf ${url} --header "Authorization: ${bearer}"`;
    case "cursor":
      return json({ mcpServers: { orbitshelf: { url, headers: { Authorization: bearer } } } });
    case "vscode":
      return json({ servers: { orbitshelf: { type: "http", url, headers: { Authorization: bearer } } } });
    case "desktop":
      return json({ mcpServers: { orbitshelf: { command: "npx", args: ["-y", "mcp-remote", url, "--header", "Authorization:${ORBITSHELF_AUTH}"], env: { ORBITSHELF_AUTH: bearer } } } });
    case "cli":
      return `curl -s ${url} \\\n  -H "Authorization: ${bearer}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`;
  }
}

function CopyButton({ text, label, done, className, testId }: { text: string; label: string; done: string; className?: string; testId?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  return (
    <button type="button" onClick={copy} data-testid={testId} className={cn("inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:border-accent", className)}>
      {copied ? <Check className="h-3.5 w-3.5 text-ok" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      <span aria-live="polite">{copied ? done : label}</span>
    </button>
  );
}

export function McpClient({ locale, tools, generationEnabled }: { locale: Locale; tools: ToolInfo[]; generationEnabled: boolean }) {
  const c = agentsCopy[locale].mcp;
  const [client, setClient] = useState<AgentClientId>("claude-code");
  // The address this page was opened from; the server render has no way to know it.
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "https://tu-sitio",
  );
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(false);

  const url = `${origin}/api/mcp`;
  const shownToken = token ?? c.placeholder;
  const snippet = snippetFor(client, url, shownToken);

  async function createToken() {
    setBusy(true);
    setProblem(false);
    const res = await fetch("/api/tokens", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "MCP", scopes: MCP_TOKEN_SCOPES }) }).catch(() => null);
    const body = res ? await res.json().catch(() => null) : null;
    if (res?.ok && typeof body?.token === "string") setToken(body.token);
    else setProblem(true);
    setBusy(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5" data-testid="mcp-panel">
      <section aria-labelledby="mcp-server-h" className="min-w-0 space-y-5 rounded-[var(--radius-card)] border border-line bg-surface-1 p-5 sm:p-6 lg:col-span-3">
        <div>
          <h2 id="mcp-server-h" className="font-display text-xl font-semibold">{c.serverTitle}</h2>
          <p className="mt-1 text-sm text-muted">{c.serverText}</p>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted">{c.urlLabel}</p>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-bg p-2 pl-4">
            <code className="min-w-0 flex-1 break-all font-mono text-sm" data-testid="mcp-url">{url}</code>
            <CopyButton text={url} label={c.copy} done={c.copied} testId="mcp-copy-url" />
          </div>
        </div>

        <div className="space-y-3">
          <p id="mcp-clients-h" className="text-xs font-medium text-muted">{c.clientsLabel}</p>
          <div role="group" aria-labelledby="mcp-clients-h" className="flex flex-wrap gap-2">
            {CLIENT_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setClient(id)}
                aria-pressed={client === id}
                data-testid={`mcp-client-${id}`}
                className={cn("rounded-full px-4 py-2 text-sm font-medium transition-colors", client === id ? "bg-accent text-bg" : "bg-surface-2 text-muted hover:text-fg")}
              >
                {c.clients[id].name}
              </button>
            ))}
            {c.soon.map((s) => (
              <span key={s.name} className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line px-4 py-2 text-sm text-muted" title={s.why}>
                <Lock className="h-3 w-3" aria-hidden="true" />
                {s.name} · {c.soonTitle}
                <span className="sr-only">. {s.why}</span>
              </span>
            ))}
          </div>
          <p className="text-xs text-muted">
            {c.clients[client].where} <span className={client === "cli" ? "text-ok" : "text-warn"}>{c.clients[client].status}</span>
          </p>
          <div className="space-y-2">
            <div className="flex justify-end">
              <CopyButton text={snippet} label={c.copy} done={c.copied} testId="mcp-copy-snippet" />
            </div>
            <pre tabIndex={0} aria-label={c.clients[client].name} className="overflow-x-auto rounded-2xl border border-line bg-bg p-4 font-mono text-xs leading-relaxed" data-testid="mcp-snippet">
              {snippet}
            </pre>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl bg-surface-2 p-4 sm:flex-row sm:items-center">
          <KeyRound className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
          <div className="min-w-0 sm:flex-1">
            <p className="text-sm font-semibold">{c.tokenTitle}</p>
            <p className="text-xs text-muted">{token ? c.tokenShown : c.tokenText}</p>
            {problem && (
              <p role="alert" className="mt-1 text-xs text-danger">
                {c.tokenFailed}
              </p>
            )}
          </div>
          <button type="button" onClick={createToken} disabled={busy || token !== null} data-testid="mcp-create-token" className="w-full rounded-full bg-accent px-5 py-2 text-sm font-semibold text-bg disabled:opacity-50 sm:w-auto">
            {busy ? c.creating : c.createToken}
          </button>
        </div>
        <p className="text-xs leading-relaxed text-muted">{c.limits}</p>
      </section>

      <div className="min-w-0 space-y-6 lg:col-span-2">
        <section aria-labelledby="mcp-tools-h" className="space-y-3 rounded-[var(--radius-card)] border border-line bg-surface-1 p-5 sm:p-6">
          <div>
            <h2 id="mcp-tools-h" className="font-display text-lg font-semibold">{c.toolsTitle}</h2>
            <p className="mt-1 text-xs text-muted">{c.toolsText}</p>
          </div>
          <ul className="divide-y divide-line" data-testid="mcp-tools">
            {tools.map((t) => {
              const kind = t.spends ? c.kinds.spends : t.scope === "jobs:write" ? c.kinds.quote : c.kinds.read;
              return (
                <li key={t.name} className="space-y-1 py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <code className="font-mono text-sm font-semibold">{t.name}</code>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", t.spends ? "bg-warn/15 text-warn" : "bg-surface-2 text-muted")}>
                      {kind}
                      {t.spends && !generationEnabled ? ` · ${c.spendsOff}` : ""}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted">{c.tools[t.name]}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="mcp-prompts-h" className="space-y-3 rounded-[var(--radius-card)] border border-line bg-surface-1 p-5 sm:p-6">
          <div>
            <h2 id="mcp-prompts-h" className="font-display text-lg font-semibold">{c.promptsTitle}</h2>
            <p className="mt-1 text-xs text-muted">{c.promptsText}</p>
          </div>
          <ul className="space-y-2">
            {c.prompts.map((p) => (
              <li key={p} className="flex flex-col gap-2 rounded-2xl bg-bg p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <p className="min-w-0 text-sm leading-relaxed">{p}</p>
                <CopyButton text={p} label={c.copyPrompt} done={c.copied} className="w-fit shrink-0" />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
