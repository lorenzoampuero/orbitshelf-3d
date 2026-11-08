import { z } from "zod";
import { apiError, apiJson, readJsonCapped, withUser } from "@/lib/api";
import { catalogItem, createCheckout, whopCheckoutConfig } from "@/lib/whop";

export const dynamic = "force-dynamic";

const schema = z.object({ item: z.string().trim().min(1).max(60) }).strict();

/** Starts a Whop checkout for one catalogue item and returns the address to send the buyer to. The workspace comes from the session, never from the request. */
export const POST = withUser(async (req, user) => {
  const cfg = whopCheckoutConfig();
  if (!cfg) return apiError(503, "billing_unavailable", "Payments are not enabled yet.");
  const read = await readJsonCapped(req);
  if (!read.ok) return read.response;
  const parsed = schema.safeParse(read.value);
  if (!parsed.success) return apiError(422, "validation", "Choose a plan or a top-up.");
  const item = catalogItem(parsed.data.item);
  if (!item) return apiError(422, "unknown_item", "That option does not exist.");
  try {
    const url = await createCheckout(cfg, { orgId: user.orgId, item });
    return apiJson({ url });
  } catch {
    return apiError(502, "billing_provider", "The payment provider did not answer. Try again in a moment.");
  }
});
