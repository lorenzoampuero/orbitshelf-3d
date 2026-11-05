import { apiError, apiJson, withUser } from "@/lib/api";
import { store, toDto } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string; versionId: string }> };

/** Makes this version the model's current file. Approval is about one exact file, so changing the file sends the review back to pending. */
export const POST = withUser<Ctx>(async (_req, user, { params }) => {
  const { id, versionId } = await params;
  const model = await store.activateVersion(user.orgId, id, versionId);
  return model ? apiJson({ model: toDto(model) }) : apiError(404, "not_found", "Version not found.");
});

export const DELETE = withUser<Ctx>(async (_req, user, { params }) => {
  const { id, versionId } = await params;
  const result = await store.deleteVersion(user.orgId, id, versionId);
  if (result === "not_found") return apiError(404, "not_found", "Version not found.");
  if (result === "protected") return apiError(409, "version_protected", "The original and the version in use cannot be deleted.");
  return apiJson({ ok: true });
});
