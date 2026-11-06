"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { localePath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/lib/types";

export function LoginForm({
  locale,
  dict,
  nextPath,
  magicLink,
}: {
  locale: Locale;
  dict: Dictionary["login"];
  nextPath?: string;
  /** Supabase magic-link mode: the form emails a link instead of opening the workspace. */
  magicLink: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      const data = (await res.json()) as { ok?: boolean; magicLink?: boolean; error?: { code?: string } };
      if (!res.ok || !data.ok) {
        const code = data.error?.code;
        setError(
          code === "auth_disabled"
            ? dict.disabled
            : code === "rate_limited" || code === "email_rate_limited"
              ? dict.rateLimited
              : code === "email_failed"
                ? dict.sendFailed
                : dict.invalidEmail,
        );
        return;
      }
      if (data.magicLink) {
        setSentTo(email.trim());
        return;
      }
      const target =
        nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : localePath(locale, "/dashboard");
      router.push(target);
      router.refresh();
    } catch {
      setError(magicLink ? dict.sendFailed : dict.invalidEmail);
    } finally {
      setSubmitting(false);
    }
  }

  if (sentTo) {
    return (
      <div role="status" className="space-y-4 rounded-2xl border border-accent/40 bg-accent/10 p-5" data-testid="login-check-email">
        <div className="flex items-center gap-3 text-base font-semibold text-fg">
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blood text-white">
            <MailCheck className="h-5 w-5" />
          </span>
          {dict.checkEmailTitle}
        </div>
        <p className="text-sm leading-relaxed text-muted">{dict.checkEmailText.replace("{email}", sentTo)}</p>
        <button type="button" onClick={() => setSentTo(null)} className="text-sm font-semibold text-accent underline-offset-4 hover:underline">
          {dict.useAnotherEmail}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-fg">
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
          className="w-full rounded-2xl border border-white/20 bg-bg px-4 py-3.5 text-sm text-fg placeholder:text-muted focus:border-accent"
        />
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        data-testid="login-submit"
        className="btn-pill btn-solid w-full whitespace-normal! px-5! disabled:opacity-50"
      >
        {submitting ? (magicLink ? dict.sending : dict.submitting) : magicLink ? dict.submitMagic : dict.submit}
      </button>

      <p className="text-center text-sm leading-relaxed text-muted">{dict.workspaceNote}</p>
    </form>
  );
}
