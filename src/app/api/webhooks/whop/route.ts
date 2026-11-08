import { NextResponse } from "next/server";
import { readBodyCapped } from "@/lib/api";
import { decideGrant, needsManualReview, parseWhopEvent, verifyWhopWebhook, whopHeaders, whopWebhookSecret } from "@/lib/whop";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 1024 * 1024;

const paymentIdOf = (event: { data: Record<string, unknown> }) => (typeof event.data.id === "string" ? event.data.id.slice(0, 200) : null);

/** Keeps a record the admin panel can show. A failure to write it must never turn a handled payment into a retry storm. */
async function logEvent(e: Parameters<typeof store.recordBillingEvent>[0]) {
  try {
    await store.recordBillingEvent({ ...e, detail: e.detail ? e.detail.slice(0, 500) : null });
  } catch (err) {
    console.error("[whop] could not record the billing event:", err instanceof Error ? err.message : "unknown");
  }
}

/**
 * Whop tells us a payment went through; this credits the workspace. Never trust the request itself: the signature is checked first,
 * credits come from OrbitShelf's catalogue, and the payment id is the ledger key so a repeated delivery cannot credit twice.
 * Answers: 404 not configured, 413 too large, 401 bad signature, 400 unreadable, 200 for everything we handled or chose to ignore
 * (Whop retries anything that is not 2xx, so a payment we cannot attribute is acknowledged and logged rather than retried forever).
 */
export async function POST(req: Request) {
  const secret = whopWebhookSecret();
  if (!secret) return new NextResponse(null, { status: 404 });
  const rawBody = await readBodyCapped(req, MAX_BODY_BYTES);
  if (!rawBody) return new NextResponse(null, { status: 413 });
  if (!verifyWhopWebhook(rawBody, whopHeaders(req.headers), secret)) return new NextResponse(null, { status: 401 });
  const event = parseWhopEvent(rawBody);
  if (!event) return new NextResponse(null, { status: 400 });

  const review = needsManualReview(event);
  if (review) {
    console.warn(`[whop] ${review.type} for payment ${review.paymentId ?? "unknown"} needs a manual credit reversal`);
    await logEvent({ kind: review.type.startsWith("dispute") ? "dispute" : "refund", paymentId: review.paymentId, orgId: null, credits: 0, outcome: "manual_review", detail: review.type });
    return NextResponse.json({ received: true, credited: false, reason: "manual_review" });
  }

  const decision = decideGrant(event);
  if (!decision.ok) {
    if (decision.reason !== "ignored") {
      console.warn(`[whop] payment not credited: ${decision.reason}`);
      await logEvent({ kind: "payment", paymentId: paymentIdOf(event), orgId: null, credits: 0, outcome: decision.reason, detail: event.type });
    }
    return NextResponse.json({ received: true, credited: false, reason: decision.reason });
  }
  const paymentId = decision.key.replace(/^whop:/, "");
  if (!(await store.getOrg(decision.orgId))) {
    console.warn("[whop] payment names a workspace that does not exist");
    await logEvent({ kind: "payment", paymentId, orgId: null, credits: 0, outcome: "unknown_org", detail: decision.item.key });
    return NextResponse.json({ received: true, credited: false, reason: "unknown_org" });
  }
  const result = await store.adjustBalance(decision.orgId, decision.credits, "plan_grant", decision.key);
  // A repeated delivery is already in the list from the first time: do not add a row for it.
  if (result !== "duplicate") await logEvent({ kind: "payment", paymentId, orgId: decision.orgId, credits: result === "applied" ? decision.credits : 0, outcome: result === "applied" ? "credited" : result, detail: decision.item.key });
  return NextResponse.json({ received: true, credited: result === "applied", result });
}
