import { apiError, apiJson, readJsonCapped, withUser } from "@/lib/api";
import { fieldErrors, patchSchema } from "@/lib/schemas";
import { store, toDto } from "@/lib/store";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const GET = withUser<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const m = await store.getModel(user.orgId, id);
  return m ? apiJson({ model: toDto(m), events: await store.listJobEvents(user.orgId, id) }) : apiError(404, "not_found", "Model not found.");
});

export const PATCH = withUser<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const read = await readJsonCapped(req);
  if (!read.ok) return read.response;
  const body = read.value;
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return apiError(422, "validation", "Check the highlighted fields.", { fields: fieldErrors(parsed.error) });
  const existing = await store.getModel(user.orgId, id);
  if (!existing) return apiError(404, "not_found", "Model not found.");
  const d = parsed.data;
  if (d.projectId && !(await store.listProjects(user.orgId)).some((p) => p.id === d.projectId)) return apiError(422, "validation", "That project does not exist.", { fields: { projectId: "not_found" } });
  const m = await store.updateModel(user.orgId, id, {
    ...(d.title !== undefined ? { title: d.title } : {}),
    ...("sku" in (body as object) ? { sku: d.sku } : {}),
    ...(d.category !== undefined ? { category: d.category } : {}),
    ...(d.dimensions ? { dimensions: d.dimensions } : {}),
    ...(d.tags ? { tags: [...new Set(d.tags)] } : {}),
    ...(d.favorite !== undefined ? { favorite: d.favorite } : {}),
    ...(d.projectId !== undefined ? { projectId: d.projectId } : {}),
  });
  return apiJson({ model: toDto(m!) });
});

/** Moves the model to the trash. Deleting for good is only possible from there. */
export const DELETE = withUser<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  if (new URL(req.url).searchParams.get("permanent") === "1") {
    if (!(await store.isInTrash(user.orgId, id))) return apiError(404, "not_found", "Model not found in the trash.");
    return (await store.deleteModel(user.orgId, id)) ? apiJson({ ok: true }) : apiError(404, "not_found", "Model not found.");
  }
  const result = await store.trashModel(user.orgId, id);
  if (result === "not_found") return apiError(404, "not_found", "Model not found.");
  if (result === "busy") return apiError(409, "job_running", "This model is still being generated. Wait for it to finish.");
  return apiJson({ ok: true, trashed: true });
});
