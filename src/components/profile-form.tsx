"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/i18n/get-dictionary";
import { GOALS_BY_USE_CASE } from "@/lib/profiles";
import { EXPERIENCES, USE_CASES, type Experience, type Goal, type UseCase, type UserProfile } from "@/lib/types";

/** The three onboarding questions. Used as the skippable card on the dashboard and, with saved answers, in Settings. */
export function ProfileForm({ dict, profile, variant }: { dict: Dictionary; profile: UserProfile | null; variant: "onboarding" | "settings" }) {
  const router = useRouter();
  const c = dict.dash.profile;
  const [useCase, setUseCase] = useState<UseCase | null>(profile?.useCase ?? null);
  const [experience, setExperience] = useState<Experience | null>(profile?.experience ?? null);
  const [goal, setGoal] = useState<Goal | null>(profile?.goal ?? null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goals = useCase ? GOALS_BY_USE_CASE[useCase] : [];
  const validGoal = goal && goals.includes(goal) ? goal : null;

  async function put(body: unknown) {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/me/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        setError(dict.common.somethingWrong);
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError(dict.common.networkError);
    } finally {
      setBusy(false);
    }
  }

  const option = (name: string, value: string, label: string, checked: boolean, onChange: () => void) => (
    <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-xl border bg-bg px-3 py-2 text-xs ${checked ? "border-accent" : "border-line"}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} data-testid={`${name}-${value}`} />
      <span>{label}</span>
    </label>
  );

  return (
    <form
      data-testid={`profile-form-${variant}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (useCase && experience && validGoal) void put({ useCase, experience, goal: validGoal });
      }}
      className="space-y-4"
    >
      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold text-fg">{c.q1}</legend>
        <div className="grid gap-2 sm:grid-cols-2">{USE_CASES.map((u) => option("use-case", u, c.useCases[u], useCase === u, () => setUseCase(u)))}</div>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold text-fg">{c.q2}</legend>
        <div className="grid gap-2 sm:grid-cols-3">{EXPERIENCES.map((x) => option("experience", x, c.experiences[x], experience === x, () => setExperience(x)))}</div>
      </fieldset>
      {useCase && (
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-fg">{c.q3}</legend>
          <div className="grid gap-2 sm:grid-cols-2">{goals.map((g) => option("goal", g, c.goals[g], validGoal === g, () => setGoal(g)))}</div>
        </fieldset>
      )}
      <p className="text-xs text-muted">{c.note}</p>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy || !useCase || !experience || !validGoal} data-testid="profile-save" className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-bg disabled:opacity-50">
          {c.save}
        </button>
        {variant === "onboarding" && (
          <button type="button" disabled={busy} onClick={() => put({ skip: true })} data-testid="profile-skip" className="rounded-xl border border-line px-4 py-2 text-xs font-medium text-fg hover:border-accent disabled:opacity-50">
            {c.skip}
          </button>
        )}
        {saved && variant === "settings" && (
          <span role="status" className="text-xs text-accent" data-testid="profile-saved">
            {c.saved}
          </span>
        )}
      </div>
    </form>
  );
}
