import { apiJson, withUser } from "@/lib/api";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export const GET = withUser(async (_req, user) => apiJson({ usage: await store.usage(user.orgId) }));
