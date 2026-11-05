import { v1Json, withToken } from "@/lib/api-tokens";
import { store, toDto } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withToken("assets:read", async (_req, token) => v1Json({ assets: (await store.listModels(token.orgId)).map(toDto) }));
