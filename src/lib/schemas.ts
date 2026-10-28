import { z } from "zod";
import { CATEGORIES, CHECKLIST_KEYS, DEMO_ASSETS, TEXTURE_RESOLUTIONS } from "@/lib/types";

const noControl = (s: string) => !/[\u0000-\u001f\u007f]/.test(s);

export const title = z.string().trim().min(1, "required").max(75, "too_long").refine(noControl, "invalid_chars");
export const sku = z
  .string()
  .trim()
  .max(64, "too_long")
  .refine(noControl, "invalid_chars")
  .transform((s) => (s === "" ? null : s))
  .nullable()
  .optional()
  .transform((s) => s ?? null);
export const category = z.enum(CATEGORIES);

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(3).max(120).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "invalid_email"),
});

export const demoCreateSchema = z.object({
  source: z.literal("demo"),
  title,
  sku,
  category,
  demoAsset: z.enum(DEMO_ASSETS),
});

export const providerFieldsSchema = z.object({
  source: z.literal("sloyd"),
  title,
  sku,
  category,
  textureResolution: z.enum(TEXTURE_RESOLUTIONS),
  confirmPaid: z.literal("true", { error: "confirm_paid_required" }),
  rightsAffirmed: z.literal("true", { error: "rights_required" }),
});

const mm = z.number().min(0).max(100_000).nullable();
export const patchSchema = z
  .object({
    title: title.optional(),
    sku,
    category: category.optional(),
    dimensions: z.object({ widthMm: mm, heightMm: mm, depthMm: mm }).optional(),
  })
  .strict();

export const reviewSchema = z.object({
  decision: z.enum(["approve", "reject", "reset", "save"]),
  checklist: z.object(Object.fromEntries(CHECKLIST_KEYS.map((k) => [k, z.boolean()])) as Record<(typeof CHECKLIST_KEYS)[number], z.ZodBoolean>),
  note: z.string().trim().max(500).refine(noControl, "invalid_chars").nullable().optional(),
});

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of error.issues) {
    const k = i.path.join(".") || "_";
    if (!(k in out)) out[k] = i.message;
  }
  return out;
}
