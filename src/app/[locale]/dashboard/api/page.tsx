import Link from "next/link";
import { notFound } from "next/navigation";
import { agentsCopy, type AgentToolName } from "@/content/agents-copy";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { apiGenerationEnabled } from "@/lib/api-tokens";
import { MCP_TOOLS } from "@/lib/mcp-server";
import { requireUser } from "@/lib/require-user";
import { buildPageMetadata } from "@/lib/seo";
import { encryptionConfigured } from "@/lib/secrets";
import { store, toApiTokenDto, toWebhookDeliveryDto, toWebhookEndpointDto } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ApiClient } from "./api-client";
import { McpClient } from "./mcp-client";
import { WebhooksClient } from "./webhooks-client";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ tab?: string }> };

const TABS = ["mcp", "api", "webhooks"] as const;
type Tab = (typeof TABS)[number];

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const c = agentsCopy[locale];
  return buildPageMetadata({ locale, path: "/dashboard/api", title: c.title, description: c.subtitle, noIndex: true });
}

/** Agents (MCP), tokens and webhooks in one place. The tab lives in the address, so each one can be linked and the page renders only what is shown. */
export default async function ApiPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { tab: asked } = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(asked ?? "") ? (asked as Tab) : "mcp";
  const c = agentsCopy[locale];
  const dict = getDictionary(locale);
  const user = await requireUser(locale);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{c.title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">{c.subtitle}</p>
        </div>
        <nav aria-label={c.tabsLabel} className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Link
              key={t}
              href={localePath(locale, `/dashboard/api${t === "mcp" ? "" : `?tab=${t}`}`)}
              aria-current={t === tab ? "page" : undefined}
              data-testid={`agents-tab-${t}`}
              className={cn("rounded-full border px-5 py-2 text-sm font-medium transition-colors", t === tab ? "border-accent bg-accent/15 text-accent" : "border-line text-muted hover:text-fg")}
            >
              {c.tabs[t]}
            </Link>
          ))}
        </nav>
      </div>

      {tab === "mcp" && (
        <McpClient
          locale={locale}
          generationEnabled={apiGenerationEnabled()}
          tools={MCP_TOOLS.map((t) => ({ name: t.name as AgentToolName, scope: t.scope, spends: t.spends }))}
        />
      )}
      {tab === "api" && <ApiClient dict={dict} initial={(await store.listApiTokens(user.orgId)).map(toApiTokenDto)} locale={locale} />}
      {tab === "webhooks" && (
        <WebhooksClient
          dict={dict}
          locale={locale}
          available={encryptionConfigured()}
          initialEndpoints={(await store.listWebhookEndpoints(user.orgId)).map(toWebhookEndpointDto)}
          initialDeliveries={(await store.listWebhookDeliveries(user.orgId)).map(toWebhookDeliveryDto)}
        />
      )}
    </div>
  );
}
