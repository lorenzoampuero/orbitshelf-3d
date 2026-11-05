import { apiError, apiJson, readJsonCapped, withUser } from "@/lib/api";
import { fieldErrors, reviewSchema } from "@/lib/schemas";
import { nowIso, store, toDto } from "@/lib/store";
import { CHECKLIST_KEYS } from "@/lib/types";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const POST = withUser<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const read = await readJsonCapped(req);
  if (!read.ok) return read.response;
  const parsed = reviewSchema.safeParse(read.value);
  if (!parsed.success) return apiError(422, "validation", "Invalid review payload.", { fields: fieldErrors(parsed.error) });
  const model = await store.getModel(user.orgId, id);
  if (!model) return apiError(404, "not_found", "Model not found.");
  if (model.status !== "ready") return apiError(409, "not_ready", "Only a finished model can be reviewed.");
  const { decision, checklist, note } = parsed.data;

  if (decision === "approve" && !CHECKLIST_KEYS.every((k) => checklist[k])) {
    return apiError(422, "checklist_incomplete", "Every checklist item must be confirmed before approval.");
  }
  const reviewState = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : decision === "reset" ? "pending" : model.reviewState === "pending" ? "pending" : model.reviewState;
  const updated = await store.updateModel(user.orgId, id, {
    checklist,
    reviewNote: note ?? null,
    reviewState: decision === "save" ? model.reviewState : reviewState,
    reviewedAt: decision === "approve" || decision === "reject" ? nowIso() : decision === "reset" ? null : model.reviewedAt,
  });
  return apiJson({ model: toDto(updated!) });
});
