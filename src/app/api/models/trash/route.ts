import { apiJson, withUser } from "@/lib/api";
import { store, toDto } from "@/lib/store";

export const dynamic = "force-dynamic";

export const GET = withUser(async (_req, user) => apiJson({ models: (await store.listTrash(user.orgId)).map(toDto) }));
