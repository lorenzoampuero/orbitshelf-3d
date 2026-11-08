import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandTile } from "@/components/brand-icons";
import { connectionsCopy, type ConnectionGroup, type ConnectionId, type ConnectionState } from "@/content/connections-copy";
import { INTEGRATION_STATUS } from "@/content/integrations";
import { isLocale, localePath } from "@/i18n/config";
import { requireUser } from "@/lib/require-user";
import { buildPageMetadata } from "@/lib/seo";
import { store } from "@/lib/store";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const c = connectionsCopy[locale];
  return buildPageMetadata({ locale, path: "/dashboard/connections", title: c.title, description: c.subtitle, noIndex: true });
}

const LAYOUT: { group: ConnectionGroup; items: ConnectionId[] }[] = [
  { group: "stores", items: ["shopify", "woocommerce"] },
  { group: "tools3d", items: ["blender", "unity"] },
  { group: "printers", items: ["octoprint", "klipper", "bambulab", "prusa"] },
  { group: "web", items: ["embed", "webhooks"] },
];

const STATE_CLASS: Record<ConnectionState, string> = {
  connected: "bg-ok/15 text-ok",
  available: "bg-accent/15 text-accent",
  testing: "bg-warn/15 text-warn",
  soon: "bg-surface-2 text-muted",
};

/** The state of each card comes from this workspace's data or from what has actually been tested (integrations/README.md). */
export default async function ConnectionsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const c = connectionsCopy[locale];
  const user = await requireUser(locale);
  const [integration, embeds, endpoints] = await Promise.all([store.getIntegration(user.orgId), store.listEmbeds(user.orgId), store.listWebhookEndpoints(user.orgId)]);

  const fromIntegrations = (s: (typeof INTEGRATION_STATUS)[keyof typeof INTEGRATION_STATUS]): ConnectionState => (s === "available" ? "available" : s === "testing" ? "testing" : "soon");
  const state: Record<ConnectionId, ConnectionState> = {
    shopify: integration && !integration.revokedAt ? "connected" : fromIntegrations(INTEGRATION_STATUS.shopify),
    woocommerce: fromIntegrations(INTEGRATION_STATUS.woocommerce),
    blender: fromIntegrations(INTEGRATION_STATUS.blender),
    unity: "testing",
    octoprint: "soon",
    klipper: "soon",
    bambulab: "soon",
    prusa: "soon",
    embed: embeds.some((e) => !e.revokedAt) ? "connected" : "available",
    webhooks: endpoints.some((e) => !e.disabledAt) ? "connected" : "testing",
  };

  const manage: Partial<Record<ConnectionId, string>> = { shopify: "/dashboard/settings", embed: "/dashboard/embeds", webhooks: "/dashboard/api?tab=webhooks" };

  return (
    <div className="space-y-8" data-testid="connections-page">
      <div>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{c.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{c.subtitle}</p>
      </div>

      <div className="grid gap-x-8 gap-y-8 xl:grid-cols-2">
      {LAYOUT.map(({ group, items }) => (
        <section key={group} aria-labelledby={`group-${group}`} className="space-y-3">
          <h2 id={`group-${group}`} className="font-display text-lg font-semibold">
            {c.groups[group]}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {items.map((id) => {
              const s = state[id];
              return (
                <li key={id} data-testid={`connection-${id}`} data-state={s} className="flex flex-col gap-3 rounded-[24px] border border-line bg-surface p-5">
                  <div className="flex items-start justify-between gap-2">
                    <BrandTile id={id} />
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATE_CLASS[s])}>{c.states[s]}</span>
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold">{c.items[id].name}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{c.items[id].text}</p>
                  </div>
                  {s !== "soon" && (
                    <Link href={localePath(locale, manage[id] ?? "/integrations")} className="mt-auto w-fit rounded-full border border-line px-4 py-1.5 text-xs font-semibold hover:border-accent">
                      {manage[id] ? c.action.manage : c.action.guide}
                      <span className="sr-only">: {c.items[id].name}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      </div>

      <p className="text-xs text-muted">{c.note}</p>
    </div>
  );
}
