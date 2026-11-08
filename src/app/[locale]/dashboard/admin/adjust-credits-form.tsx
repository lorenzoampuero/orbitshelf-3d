"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminCopy } from "@/content/admin-copy";

/** Calls POST /api/admin/credits. The server checks that the visitor is an administrator; hiding this form is only a courtesy. */
export function AdjustCreditsForm({ copy, orgId, withOrgField = false }: { copy: AdminCopy["form"]; orgId?: string; withOrgField?: boolean }) {
  const router = useRouter();
  const [org, setOrg] = useState(orgId ?? "");
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [payment, setPayment] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "busy" | "ok" | "error"; text?: string }>({ kind: "idle" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "busy" });
    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: org.trim(), delta: Number(delta), reason, ...(payment.trim() ? { resolvesPaymentId: payment.trim() } : {}) }),
      });
      const body = (await res.json().catch(() => ({}))) as { balance?: number; error?: { message?: string } };
      if (!res.ok) {
        setState({ kind: "error", text: body.error?.message ?? copy.error });
        return;
      }
      setState({ kind: "ok", text: `${copy.done} ${body.balance}` });
      setDelta("");
      setReason("");
      setPayment("");
      router.refresh();
    } catch {
      setState({ kind: "error", text: copy.error });
    }
  }

  const field = "w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-accent";
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" data-testid="admin-adjust-form">
      {withOrgField && (
        <label className="space-y-1.5 text-xs font-medium text-muted sm:col-span-2">
          {copy.workspaceId}
          <input id="adj-org" required value={org} onChange={(e) => setOrg(e.target.value)} className={field} placeholder="org_…" autoComplete="off" />
        </label>
      )}
      <label className="space-y-1.5 text-xs font-medium text-muted">
        {copy.change}
        <input id="adj-delta" required inputMode="numeric" pattern="-?[0-9]+" value={delta} onChange={(e) => setDelta(e.target.value)} className={field} placeholder="150" aria-describedby="adj-delta-hint" />
        <span id="adj-delta-hint" className="block font-normal">{copy.changeHint}</span>
      </label>
      <label className="space-y-1.5 text-xs font-medium text-muted">
        {copy.paymentId}
        <input id="adj-payment" value={payment} onChange={(e) => setPayment(e.target.value)} className={field} placeholder="pay_…" autoComplete="off" aria-describedby="adj-payment-hint" />
        <span id="adj-payment-hint" className="block font-normal">{copy.paymentHint}</span>
      </label>
      <label className="space-y-1.5 text-xs font-medium text-muted sm:col-span-2">
        {copy.reason}
        <input id="adj-reason" required minLength={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} className={field} aria-describedby="adj-reason-hint" />
        <span id="adj-reason-hint" className="block font-normal">{copy.reasonHint}</span>
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={state.kind === "busy"} className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-bg transition-opacity disabled:opacity-60">
          {state.kind === "busy" ? copy.sending : copy.submit}
        </button>
        <p role="status" aria-live="polite" className={state.kind === "error" ? "text-sm text-danger" : "text-sm text-ok"} data-testid="admin-adjust-status">
          {state.text}
        </p>
      </div>
    </form>
  );
}
