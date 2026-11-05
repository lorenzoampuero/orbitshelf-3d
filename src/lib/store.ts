import "server-only";
import { postgresStoreFromEnv } from "@/lib/store-postgres";
import { databaseUrl } from "@/lib/env";
import { localStore, type Store } from "@/lib/store-local";

export * from "@/lib/store-shared";
export type { Store };

let cached: { url: string; store: Store } | null = null;

/** Postgres when DATABASE_URL is set, otherwise the single-process JSON store for local development. */
function backend(): Store {
  const url = databaseUrl();
  if (!url) return localStore;
  if (cached?.url !== url) cached = { url, store: postgresStoreFromEnv(url) };
  return cached.store;
}

export const usesSharedDatabase = () => databaseUrl() !== null;

export const store: Store = new Proxy({} as Store, {
  get: (_target, key) => backend()[key as keyof Store],
});
