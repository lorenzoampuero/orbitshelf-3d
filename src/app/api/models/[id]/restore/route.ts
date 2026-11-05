import { apiError, apiJson, withUser } from "@/lib/api";
import { store, toDto } from "@/lib/store";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const POST = withUser<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const model = await store.restoreModel(user.orgId, id);
  return model ? apiJson({ model: toDto(model) }) : apiError(404, "not_found", "Model not found.");
});
