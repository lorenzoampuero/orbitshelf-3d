import { withUser } from "@/lib/api";
import { toCsv } from "@/lib/csv";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

const COLUMNS = [
  { key: "id", header: "id" },
  { key: "title", header: "title" },
  { key: "sku", header: "sku" },
  { key: "category", header: "category" },
  { key: "source", header: "source" },
  { key: "provenance", header: "provenance" },
  { key: "status", header: "status" },
  { key: "jobState", header: "job_state" },
  { key: "engineId", header: "engine" },
  { key: "estimatedCostUsd", header: "estimated_cost_usd" },
  { key: "reviewState", header: "review_state" },
  { key: "failureCode", header: "failure_code" },
  { key: "error", header: "error" },
  { key: "attemptsDebited", header: "attempts_debited" },
  { key: "attemptsRefunded", header: "attempts_refunded" },
  { key: "providerCreditsEstimate", header: "provider_credits_estimate" },
  { key: "textureResolution", header: "texture_resolution" },
  { key: "fileSize", header: "glb_bytes" },
  { key: "checksum", header: "glb_sha256" },
  { key: "createdAt", header: "created_at" },
  { key: "updatedAt", header: "updated_at" },
] as const;

export const GET = withUser(async (_req, user) => {
  const rows = await store.listModels(user.orgId);
  const csv = toCsv(rows as unknown as Record<string, unknown>[], COLUMNS.map((c) => ({ key: c.key as string, header: c.header })));
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="orbitshelf-job-history.csv"',
      "Cache-Control": "private, no-store",
    },
  });
});
