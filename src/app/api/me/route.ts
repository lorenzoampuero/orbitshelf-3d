import { apiJson, withUser } from "@/lib/api";
import { providerConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export const GET = withUser(async (_req, user) => apiJson({ email: user.email, workspace: user.orgId, providerConfigured: providerConfigured() }));
