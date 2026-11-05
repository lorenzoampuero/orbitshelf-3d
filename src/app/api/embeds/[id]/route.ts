import { apiError, apiJson, withUser } from "@/lib/api";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Revoking is immediate on the server. A browser may keep what it has for up to a minute. */
export const DELETE = withUser<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  return (await store.revokeEmbed(user.orgId, id)) ? apiJson({ ok: true }) : apiError(404, "not_found", "Link not found.");
});
