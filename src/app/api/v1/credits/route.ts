import { v1Json, withToken } from "@/lib/api-tokens";
import { billingUnit } from "@/lib/env";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withToken("credits:read", async (_req, token) => {
  const u = await store.usage(token.orgId);
  return v1Json({ balance: u.balance, unit: billingUnit(), activeJobs: u.activeJobs, maxActiveJobs: u.maxActiveJobs });
});
