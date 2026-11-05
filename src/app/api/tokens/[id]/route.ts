import { apiError, apiJson, withUser } from "@/lib/api";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const DELETE = withUser<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  return (await store.revokeApiToken(user.orgId, id)) ? apiJson({ ok: true }) : apiError(404, "not_found", "Token not found.");
});
