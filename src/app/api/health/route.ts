import { apiJson } from "@/lib/api";
import { authMode, providerConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Never returns secrets, only booleans. */
export function GET() {
  return apiJson({
    ok: true,
    app: "orbitshelf-3d",
    version: "0.1.0",
    storage: "local-adapter",
    auth: { supabase: "supabase-magic-link", local: "local-dev-signin", disabled: "disabled" }[authMode()],
    provider: providerConfigured() ? "configured" : "not-configured",
    mode: providerConfigured() ? "demo+provider" : "demo-only",
  });
}
