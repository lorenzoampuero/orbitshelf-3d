"use client";

import { useRouter } from "next/navigation";
import { localePath } from "@/i18n/config";
import type { Locale } from "@/lib/types";

export function SignOutButton({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter();
  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(localePath(locale, "/login"));
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={handleSignOut}
      data-testid="settings-signout-btn"
      className="rounded-xl border border-line bg-bg px-4 py-2 text-xs font-medium text-fg hover:border-mint"
    >
      {label}
    </button>
  );
}
