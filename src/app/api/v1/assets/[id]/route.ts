import { v1Error, v1Json, withToken } from "@/lib/api-tokens";
import { refreshJob } from "@/lib/jobs";
import { store, toDto } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

/** A job and its asset are the same record. Reading one still in progress also checks on it. */
export const GET = withToken<Ctx>("assets:read", async (_req, token, { params }) => {
  const { id } = await params;
  const model = (await refreshJob(token.orgId, id)) ?? (await store.getModel(token.orgId, id));
  return model ? v1Json({ asset: toDto(model), events: await store.listJobEvents(token.orgId, id) }) : v1Error(404, "not_found", "Asset not found.");
});
