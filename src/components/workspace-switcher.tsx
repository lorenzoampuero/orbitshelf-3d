"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/i18n/get-dictionary";
import { USE_CASES, type UseCase } from "@/lib/types";

export function WorkspaceSwitcher({ dict, active }: { dict: Dictionary; active: UseCase | null }) {
  const router = useRouter();
  const [value, setValue] = useState<UseCase | "">(active ?? "");

  async function change(next: UseCase) {
    setValue(next);
    const res = await fetch("/api/me/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activeWorkspace: next }) }).catch(() => null);
    if (res?.ok) router.refresh();
  }

  return (
    <label className="flex items-center gap-2 text-xs text-muted">
      <span>{dict.dash.profile.workspace}</span>
      <select
        value={value}
        onChange={(e) => change(e.target.value as UseCase)}
        data-testid="workspace-select"
        className="rounded-xl border border-line bg-bg px-3 py-2 text-xs font-medium text-fg"
      >
        {value === "" && <option value="">{dict.dash.profile.noWorkspace}</option>}
        {USE_CASES.map((u) => (
          <option key={u} value={u}>
            {dict.dash.profile.useCases[u]}
          </option>
        ))}
      </select>
    </label>
  );
}
