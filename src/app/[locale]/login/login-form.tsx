"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { localePath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/lib/types";

export function LoginForm({
  locale,
  dict,
  nextPath,
}: {
  locale: Locale;
  dict: Dictionary["login"];
  nextPath?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("merchant@example.com");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: { code?: string; message?: string } };
      if (!res.ok || !data.ok) {
        setError(data.error?.code === "auth_disabled" ? dict.disabled : dict.invalidEmail);
        return;
      }
      const target =
        nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : localePath(locale, "/dashboard");
      router.push(target);
      router.refresh();
    } catch {
      setError(dict.invalidEmail);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="login-email" className="block text-xs font-medium text-fg mb-1.5">
          {dict.emailLabel}
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={dict.emailPlaceholder}
          className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm text-fg placeholder:text-muted"
        />
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-danger/50 bg-danger/10 px-3.5 py-2.5 text-xs text-danger">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        data-testid="login-submit"
        className="w-full rounded-xl bg-mint px-4 py-2.5 text-sm font-semibold text-bg disabled:opacity-50"
      >
        {submitting ? dict.submitting : dict.submit}
      </button>

      <p className="text-xs text-muted">{dict.workspaceNote}</p>
    </form>
  );
}
