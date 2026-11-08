import { randomUUID } from "node:crypto";
import { z } from "zod";
import { apiError, apiJson, currentUser, readJsonCapped, sameOrigin } from "@/lib/api";
import { isAdminUser } from "@/lib/admin";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

const Body = z.object({
  orgId: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
  delta: z.number().int().refine((n) => n !== 0 && Math.abs(n) <= 100_000, "Use a whole number other than 0, up to 100,000 either way."),
  reason: z.string().trim().min(3, "Write a reason (at least 3 characters).").max(300),
  /** The payment this change settles (a refund reversed, a payment credited by hand). Marks it as handled in the list. */
  resolvesPaymentId: z.string().trim().min(1).max(200).optional(),
});

/**
 * Owner-only credit change: a courtesy grant, a correction, or the reversal of a refund. Needs a signed-in administrator
 * (ADMIN_EMAILS), a same-origin request and a written reason. Every change is applied once and listed in the admin payments page.
 * A balance can never go below zero.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return apiError(403, "bad_origin", "Cross-site requests are not allowed.");
  const user = await currentUser();
  // Not an administrator → the same answer as a route that does not exist.
  if (!isAdminUser(user)) return apiError(404, "not_found", "Not found.");
  const read = await readJsonCapped(req);
  if (!read.ok) return read.response;
  const parsed = Body.safeParse(read.value);
  if (!parsed.success) return apiError(400, "invalid_body", parsed.error.issues[0]?.message ?? "Invalid request.");
  const { orgId, delta, reason, resolvesPaymentId } = parsed.data;
  if (!(await store.getOrg(orgId))) return apiError(404, "no_workspace", "That workspace does not exist.");
  const result = await store.adjustBalance(orgId, delta, "adjustment", `admin:${randomUUID()}`);
  if (result === "insufficient") return apiError(409, "insufficient", "That would leave the balance below zero.");
  await store.recordBillingEvent({ kind: "admin_adjustment", paymentId: null, orgId, credits: delta, outcome: "adjusted", detail: `${user!.email}: ${reason}`.slice(0, 500) });
  if (resolvesPaymentId) await store.resolveBillingEvents(resolvesPaymentId);
  const usage = await store.usage(orgId);
  return apiJson({ ok: true, balance: usage.balance });
}
