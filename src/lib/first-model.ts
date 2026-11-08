import type { ModelDto } from "./types";

export const FIRST_MODEL_STEPS = ["create", "ready", "approve", "publish"] as const;
export type FirstModelStep = (typeof FIRST_MODEL_STEPS)[number];
export type StepState = "done" | "waiting" | "todo";

export type FirstModelProgress = {
  steps: Record<FirstModelStep, StepState>;
  done: number;
  total: number;
  complete: boolean;
  /** Model the next review/open step should point to, if there is one. */
  focusModelId: string | null;
};

/**
 * Where a workspace stands on "first model": computed only from what exists, never from a flag the user ticks.
 * A step counts as done when its result is real (a ready model, an approved model, a live embed).
 */
export function firstModelProgress(models: Pick<ModelDto, "id" | "status" | "reviewState" | "deletedAt">[], liveEmbeds: number): FirstModelProgress {
  const alive = models.filter((m) => !m.deletedAt);
  const ready = alive.filter((m) => m.status === "ready");
  const approved = alive.filter((m) => m.reviewState === "approved");
  const processing = alive.some((m) => m.status === "processing");

  const steps: Record<FirstModelStep, StepState> = {
    create: alive.length > 0 ? "done" : "todo",
    ready: ready.length > 0 ? "done" : processing ? "waiting" : "todo",
    approve: approved.length > 0 ? "done" : "todo",
    publish: liveEmbeds > 0 ? "done" : "todo",
  };
  const done = FIRST_MODEL_STEPS.filter((s) => steps[s] === "done").length;
  const focus = ready.find((m) => m.reviewState !== "approved") ?? ready[0] ?? alive[0] ?? null;
  return { steps, done, total: FIRST_MODEL_STEPS.length, complete: done === FIRST_MODEL_STEPS.length, focusModelId: focus?.id ?? null };
}

/** True when the balance cannot pay for one more job. `minimum` is the cheapest job in the workspace's unit. */
export const lowCredits = (balance: number, minimum = 1): boolean => balance < minimum;
