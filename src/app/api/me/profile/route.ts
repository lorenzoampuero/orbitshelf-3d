import { z } from "zod";
import { apiError, apiJson, readJsonCapped, withUser } from "@/lib/api";
import { GOALS_BY_USE_CASE } from "@/lib/profiles";
import { fieldErrors } from "@/lib/schemas";
import { nowIso, store } from "@/lib/store";
import { EXPERIENCES, GOALS, USE_CASES } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = withUser(async (_req, user) => apiJson({ profile: await store.getProfile(user.userId) }));

const answersSchema = z
  .object({ useCase: z.enum(USE_CASES), experience: z.enum(EXPERIENCES), goal: z.enum(GOALS) })
  .strict()
  .refine((a) => GOALS_BY_USE_CASE[a.useCase].includes(a.goal), { message: "goal_not_for_use_case", path: ["goal"] });
const skipSchema = z.object({ skip: z.literal(true) }).strict();
const workspaceSchema = z.object({ activeWorkspace: z.enum(USE_CASES) }).strict();

/** Answers, a skip, or a workspace switch. None of them can reach anything but these preferences. */
export const PUT = withUser(async (req, user) => {
  const read = await readJsonCapped(req);
  if (!read.ok) return read.response;

  const skip = skipSchema.safeParse(read.value);
  if (skip.success) return apiJson({ profile: await store.saveProfile(user.userId, { skippedAt: nowIso() }) });

  const workspace = workspaceSchema.safeParse(read.value);
  if (workspace.success) return apiJson({ profile: await store.saveProfile(user.userId, { activeWorkspace: workspace.data.activeWorkspace }) });

  const answers = answersSchema.safeParse(read.value);
  if (!answers.success) return apiError(422, "validation", "Check the highlighted fields.", { fields: fieldErrors(answers.error) });
  return apiJson({ profile: await store.saveProfile(user.userId, { ...answers.data, activeWorkspace: answers.data.useCase, onboardedAt: nowIso() }) });
});
