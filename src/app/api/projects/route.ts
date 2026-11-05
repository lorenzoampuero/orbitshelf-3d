import { randomUUID } from "node:crypto";
import { z } from "zod";
import { apiError, apiJson, readJsonCapped, withUser } from "@/lib/api";
import { nowIso, store } from "@/lib/store";

export const dynamic = "force-dynamic";

export const GET = withUser(async (_req, user) => apiJson({ projects: await store.listProjects(user.orgId) }));

const createSchema = z.object({ name: z.string().trim().min(1).max(60).refine((s) => !/[\u0000-\u001f\u007f]/.test(s)) }).strict();

export const POST = withUser(async (req, user) => {
  const read = await readJsonCapped(req);
  if (!read.ok) return read.response;
  const parsed = createSchema.safeParse(read.value);
  if (!parsed.success) return apiError(422, "validation", "Check the project name.");
  return apiJson({ project: await store.createProject(user.orgId, { id: randomUUID(), name: parsed.data.name, createdAt: nowIso() }) }, 201);
});
