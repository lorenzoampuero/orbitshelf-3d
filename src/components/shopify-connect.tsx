"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";

export function ShopifyConnect({ dict, available, initialShop }: { dict: Dictionary; available: boolean; initialShop: string | null }) {
  const c = dict.dash.shopify;
  const [shop, setShop] = useState(initialShop);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!available) {
    return (
      <p className="text-muted" data-testid="shopify-unavailable">
        {c.notConfigured}
      </p>
    );
  }

  async function disconnect() {
    const res = await fetch("/api/integrations/shopify", { method: "DELETE" }).catch(() => null);
    if (res?.ok) setShop(null);
    else setError(dict.common.somethingWrong);
  }

  if (shop) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-muted" data-testid="shopify-connected">{c.connectedTo.replace("{shop}", shop)}</span>
        <button type="button" onClick={disconnect} data-testid="shopify-disconnect" className="rounded-xl border border-line bg-surface px-3 py-1.5 font-medium text-danger hover:border-danger">
          {c.disconnect}
        </button>
        <p className="w-full text-muted">{c.disconnectNote}</p>
        {error && <p role="alert" className="w-full text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // A full navigation: this leaves the app for Shopify and comes back through the callback.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        if (input.trim()) window.location.href = `/api/integrations/shopify/install?shop=${encodeURIComponent(input.trim())}`;
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <div className="min-w-0 flex-1">
        <label htmlFor="shopify-shop" className="block font-medium text-muted">{c.shopLabel}</label>
        <input id="shopify-shop" value={input} onChange={(e) => setInput(e.target.value)} placeholder="mitienda.myshopify.com" data-testid="shopify-shop-input" className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-fg" />
      </div>
      <button type="submit" data-testid="shopify-connect" className="rounded-xl bg-accent px-4 py-2 font-semibold text-bg">{c.connect}</button>
    </form>
  );
}
