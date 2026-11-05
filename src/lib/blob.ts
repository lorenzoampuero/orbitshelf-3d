import "server-only";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { dataDir, supabaseStorageConfig, type SupabaseStorageConfig } from "@/lib/env";

/** Where private files live. Nothing here is ever public: files only reach a browser through an authorised API route. */
export type BlobStore = {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
};

const SAFE_KEY = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_.-]+)+$/;
function assertKey(key: string) {
  if (!SAFE_KEY.test(key) || key.includes("..")) throw new Error("Invalid storage key.");
  return key;
}

export function localBlobStore(root = () => dataDir()): BlobStore {
  const file = (key: string) => path.join(root(), ...assertKey(key).split("/"));
  return {
    async put(key, data) {
      const f = file(key);
      mkdirSync(path.dirname(f), { recursive: true });
      writeFileSync(f, data);
    },
    async get(key) {
      const f = file(key);
      return existsSync(f) ? readFileSync(f) : null;
    },
    async delete(key) {
      rmSync(file(key), { force: true });
    },
  };
}

/** Private Supabase Storage bucket over REST. The secret key stays on the server and is never put in a URL. */
export function supabaseBlobStore(cfg: SupabaseStorageConfig, deps?: { fetch?: typeof fetch }): BlobStore {
  const f = deps?.fetch ?? fetch;
  const url = (key: string) => `${cfg.url}/storage/v1/object/${encodeURIComponent(cfg.bucket)}/${assertKey(key).split("/").map(encodeURIComponent).join("/")}`;
  const headers = { apikey: cfg.secretKey, Authorization: `Bearer ${cfg.secretKey}` };
  return {
    async put(key, data, contentType) {
      const res = await f(url(key), {
        method: "POST",
        headers: { ...headers, "Content-Type": contentType, "x-upsert": "true" },
        body: new Uint8Array(data),
        signal: AbortSignal.timeout(120_000),
        cache: "no-store",
        redirect: "error",
      });
      if (!res.ok) throw new Error(`Storage upload failed (HTTP ${res.status}).`);
    },
    async get(key) {
      const res = await f(url(key), { headers, signal: AbortSignal.timeout(120_000), cache: "no-store", redirect: "error" });
      // Supabase Storage reports a missing object as 400 or 404, depending on the version.
      if (res.status === 404 || res.status === 400) return null;
      if (!res.ok) throw new Error(`Storage download failed (HTTP ${res.status}).`);
      return Buffer.from(await res.arrayBuffer());
    },
    async delete(key) {
      const res = await f(url(key), { method: "DELETE", headers, signal: AbortSignal.timeout(30_000), cache: "no-store", redirect: "error" });
      if (!res.ok && res.status !== 404 && res.status !== 400) throw new Error(`Storage delete failed (HTTP ${res.status}).`);
    },
  };
}

export function blobStoreFromEnv(): BlobStore {
  const cfg = supabaseStorageConfig();
  return cfg ? supabaseBlobStore(cfg) : localBlobStore();
}
