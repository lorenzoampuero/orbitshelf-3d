"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isLocale, localePath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/lib/types";

/** Reads the tokens Supabase puts in the URL fragment, strips them from the address bar and opens the workspace. */
export function CallbackClient({ locale, dict }: { locale: Locale; dict: Dictionary["login"] }) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const started = useRef(false);
  const query = typeof window === "undefined" ? null : new URLSearchParams(window.location.search);
  const requested = query?.get("l");
  const target: Locale = requested && isLocale(requested) ? requested : locale;

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hash.get("access_token");
    // Never leave tokens in the address bar or browser history.
    window.history.replaceState(null, "", window.location.pathname);
    const signIn = async () => {
      if (!accessToken || hash.get("error")) throw new Error("missing token");
      const res = await fetch("/api/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });
      if (!res.ok) throw new Error(String(res.status));
      router.replace(localePath(target, "/dashboard"));
      router.refresh();
    };
    signIn().catch(() => setFailed(true));
  }, [router, target]);

  if (failed) {
    return (
      <div className="space-y-3">
        <p role="alert" className="rounded-xl border border-danger/50 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          {dict.callbackError}
        </p>
        <Link href={localePath(target, "/login")} className="text-sm font-semibold text-accent hover:underline">
          {dict.backToLogin}
        </Link>
      </div>
    );
  }
  return (
    <p role="status" className="text-sm text-muted">
      {dict.callbackLoading}
    </p>
  );
}
