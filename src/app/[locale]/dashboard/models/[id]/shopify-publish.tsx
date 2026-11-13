"use client";

import { useCallback, useEffect, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { ModelDto, PublicationDto } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

type Product = { id: string; title: string; status: string; imageUrl: string | null };

/** Only shown for an approved model on a connected store. Nothing is published until the person chooses a product and confirms. */
export function ShopifyPublish({ model, t }: { model: ModelDto; t: Dictionary }) {
  const c = t.dash.shopify;
  const [shop, setShop] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[] | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publications, setPublications] = useState<PublicationDto[]>([]);

  const loadPublications = useCallback(async () => {
    const res = await fetch(`/api/integrations/shopify/publish?modelId=${encodeURIComponent(model.id)}`).catch(() => null);
    const body = res?.ok ? await res.json().catch(() => null) : null;
    return (body?.publications ?? []) as PublicationDto[];
  }, [model.id]);

  useEffect(() => {
    let stale = false;
    fetch("/api/integrations/shopify")
      .then((r) => (r.ok ? r.json() : null))
      .then((b: { shop: string | null } | null) => {
        if (!stale) setShop(b?.shop ?? null);
      })
      .catch(() => undefined);
    loadPublications().then((p) => {
      if (!stale) setPublications(p);
    });
    return () => {
      stale = true;
    };
  }, [loadPublications]);

  // Shopify processes the file on its side, so a publication in progress is checked until it finishes.
  const processing = publications.find((p) => p.state === "processing");
  useEffect(() => {
    if (!processing) return;
    const id = setInterval(async () => {
      const res = await fetch(`/api/integrations/shopify/publish/${encodeURIComponent(processing.id)}`, { method: "POST" }).catch(() => null);
      const body = res?.ok ? await res.json().catch(() => null) : null;
      if (body?.publication) setPublications((prev) => prev.map((p) => (p.id === processing.id ? body.publication : p)));
    }, 3000);
    return () => clearInterval(id);
  }, [processing]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/integrations/shopify/products?q=${encodeURIComponent(query)}`).catch(() => null);
    const body = res ? await res.json().catch(() => null) : null;
    if (res?.ok && body?.products) setProducts(body.products);
    else setError(body?.error?.message ?? t.common.somethingWrong);
  }

  async function publish() {
    if (!product || !confirmed) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/shopify/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: model.id, productId: product.id, productTitle: product.title, confirm: true }),
      });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.publication) {
        setPublications(await loadPublications());
        setProduct(null);
        setConfirmed(false);
      } else {
        setError(body?.error?.message ?? t.common.somethingWrong);
      }
    } catch {
      setError(t.common.networkError);
    } finally {
      setBusy(false);
    }
  }

  if (!shop) return null;

  return (
    <section aria-labelledby="shopify-heading" className="space-y-4 rounded-[var(--radius-card)] border border-line bg-surface-1 p-5 text-xs" data-testid="shopify-publish">
      <div>
        <h2 id="shopify-heading" className="font-display text-sm font-semibold text-fg">{c.publishTitle}</h2>
        <p className="mt-1 text-muted">{c.connectedTo.replace("{shop}", shop)}</p>
      </div>

      {model.reviewState !== "approved" ? (
        <p className="text-muted" data-testid="shopify-needs-approval">{c.needsApproval}</p>
      ) : (
        <>
          <form onSubmit={search} className="flex gap-2">
            <label htmlFor="shopify-search" className="sr-only">{c.searchLabel}</label>
            <input id="shopify-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={c.searchLabel} data-testid="shopify-search-input" className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg" />
            <button type="submit" data-testid="shopify-search-btn" className="rounded-xl border border-line bg-bg px-3 py-2 font-medium text-fg hover:border-accent">{c.search}</button>
          </form>

          {products && products.length === 0 && <p className="text-muted">{c.noProducts}</p>}
          {products && products.length > 0 && (
            <ul className="max-h-48 divide-y divide-line overflow-y-auto border-y border-line">
              {products.map((p) => (
                <li key={p.id}>
                  <label className="flex cursor-pointer items-center gap-2 py-2">
                    <input type="radio" name="shopify-product" checked={product?.id === p.id} onChange={() => setProduct(p)} data-testid={`shopify-product-${p.id.split("/").pop()}`} />
                    <span className="font-medium text-fg">{p.title}</span>
                    <span className="text-muted">{p.status}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          {product && (
            <div className="space-y-2 rounded-xl border border-line bg-bg p-3">
              <p className="text-fg" data-testid="shopify-summary">
                {c.summary.replace("{model}", model.title).replace("{product}", product.title).replace("{size}", model.fileSize ? formatBytes(model.fileSize) : "?")}
              </p>
              <p className="text-muted">{c.themeNote}</p>
              <label className="flex cursor-pointer items-start gap-2">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} data-testid="shopify-confirm" className="mt-0.5" />
                <span className="text-fg">{c.confirm}</span>
              </label>
              <button type="button" disabled={!confirmed || busy} onClick={publish} data-testid="shopify-publish-btn" className="rounded-xl bg-accent px-4 py-2 font-semibold text-bg disabled:opacity-50">
                {busy ? c.publishing : c.publish}
              </button>
            </div>
          )}
        </>
      )}

      {publications.length > 0 && (
        <ul className="divide-y divide-line border-y border-line" data-testid="shopify-publications">
          {publications.map((p) => (
            <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span className="text-fg">{p.productTitle}</span>
              <span className={p.state === "failed" ? "text-danger" : p.state === "published" ? "text-accent" : "text-muted"} data-testid="shopify-publication-state">
                {c.states[p.state]}
                {p.error ? `: ${p.error}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert" className="text-danger" data-testid="shopify-error">{error}</p>}
    </section>
  );
}
