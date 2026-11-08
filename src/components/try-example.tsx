"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { localePath } from "@/i18n/config";
import type { Example } from "@/content/examples";
import type { Locale } from "@/lib/types";

/** Copies an example into the workspace as a demo sample (free, no engine) and opens it. */
export function useTryExample(locale: Locale, errorText: string) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function tryExample(example: Example) {
    setBusy(example.id);
    setError(null);
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "demo", title: example.title[locale], sku: null, category: example.category, demoAsset: example.id }),
      });
      const data = (await res.json().catch(() => null)) as { model?: { id: string } } | null;
      if (!res.ok || !data?.model) {
        setError(errorText);
        setBusy(null);
        return;
      }
      router.push(localePath(locale, `/dashboard/models/${data.model.id}`));
      router.refresh();
    } catch {
      setError(errorText);
      setBusy(null);
    }
  }

  return { tryExample, busy, error };
}

export function TryExampleButton({ locale, example, label, busyLabel, errorText }: { locale: Locale; example: Example; label: string; busyLabel: string; errorText: string }) {
  const { tryExample, busy, error } = useTryExample(locale, errorText);
  return (
    <div className="flex flex-col items-start gap-1">
      <button type="button" onClick={() => tryExample(example)} disabled={busy !== null} data-testid="try-example-btn" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-bg disabled:opacity-70">
        {busy ? busyLabel : label}
      </button>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
