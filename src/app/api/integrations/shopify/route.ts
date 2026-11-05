import { apiJson, withUser } from "@/lib/api";
import { encryptionConfigured } from "@/lib/secrets";
import { shopifyConfig } from "@/lib/shopify";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Connection state only. A token never leaves the server, not even encrypted. */
export const GET = withUser(async (_req, user) => {
  const row = await store.getIntegration(user.orgId);
  return apiJson({ available: Boolean(shopifyConfig()) && encryptionConfigured(), shop: row && !row.revokedAt ? row.shop : null });
});

/** Stops future publications. Files already in the store and the models here are left alone. */
export const DELETE = withUser(async (_req, user) => {
  await store.revokeIntegration(user.orgId);
  return apiJson({ ok: true });
});
