import "server-only";
import path from "node:path";

export function dataDir(): string {
  return path.resolve(
    /*turbopackIgnore: true*/ (process.env.DATA_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), ".data")),
  );
}

export function intEnv(name: string, fallback: number, min = 0, max = 1_000_000): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/** How a job is charged. "attempts": every job counts one. "credits": a job costs what its engine costs. */
export const billingUnit = (): "attempts" | "credits" => (process.env.BILLING_UNIT === "credits" ? "credits" : "attempts");

export const paidAttemptCap = () => intEnv("LOCAL_PAID_ATTEMPT_CAP", 3, 0, 10_000);
export const maxActiveJobs = () => intEnv("MAX_ACTIVE_JOBS_PER_ORG", 2, 1, 5);

export function localAuthAllowed(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.ALLOW_LOCAL_AUTH === "true";
}

/** Postgres connection string. Server-only, and it contains a password. Null → the local JSON store. */
export const databaseUrl = () => process.env.DATABASE_URL?.trim() || null;

export type SupabaseStorageConfig = { url: string; secretKey: string; bucket: string };

/** The private file bucket. Needs the secret key, which must never reach the browser or a log. Null → files stay on local disk. */
export function supabaseStorageConfig(): SupabaseStorageConfig | null {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !secretKey || !url.startsWith("https://")) return null;
  return { url, secretKey, bucket: process.env.SUPABASE_STORAGE_BUCKET?.trim() || "orbitshelf-private" };
}

export type SupabaseConfig = { url: string; publishableKey: string };

/** Supabase Auth (magic link). Null → no Supabase; AUTH_MODE=local forces the local sign-in (tests, offline dev). */
export function supabaseConfig(): SupabaseConfig | null {
  if (process.env.AUTH_MODE === "local") return null;
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey || !url.startsWith("https://")) return null;
  return { url, publishableKey };
}

export type AuthMode = "supabase" | "local" | "disabled";
export const authMode = (): AuthMode => (supabaseConfig() ? "supabase" : localAuthAllowed() ? "local" : "disabled");

export type ProviderConfig = {
  clientId: string;
  clientSecret: string;
  apiBase: string;
  resultBase: string;
};

export const DEFAULT_API_BASE = "https://api.sloyd.ai/api";
export const DEFAULT_RESULT_BASE = "https://storage.googleapis.com/ai-services-quality/jobs/";

/** Returns null when credentials are absent → demo mode. */
export function providerConfig(): ProviderConfig | null {
  const clientId = process.env.SLOYD_CLIENT_ID?.trim();
  const clientSecret = process.env.SLOYD_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  const apiBase = (process.env.SLOYD_API_BASE_URL?.trim() || DEFAULT_API_BASE).replace(/\/+$/, "");
  const resultBase = process.env.SLOYD_RESULT_BASE_URL?.trim() || DEFAULT_RESULT_BASE;
  return { clientId, clientSecret, apiBase, resultBase: resultBase.endsWith("/") ? resultBase : resultBase + "/" };
}

export const providerConfigured = () => providerConfig() !== null;

export type FalConfig = {
  key: string;
  queueBase: string;
  /** Hosts a generated file may be downloaded from (the URL comes from a third party and the server fetches it). */
  resultHosts: string[];
  allowInsecureResultHosts: boolean;
};

export const DEFAULT_FAL_QUEUE_BASE = "https://queue.fal.run";
const DEFAULT_FAL_RESULT_HOSTS = ["fal.media", "fal.ai", "storage.googleapis.com"];

/** Null → fal is off. The base URL and host overrides only apply in test mode, so a stray variable cannot send the key elsewhere. */
export function falConfig(): FalConfig | null {
  const key = process.env.FAL_KEY?.trim();
  if (!key) return null;
  const test = process.env.ORBITSHELF_TEST === "1";
  const queueBase = (test && process.env.FAL_QUEUE_BASE_URL?.trim()) || DEFAULT_FAL_QUEUE_BASE;
  const hosts = test && process.env.FAL_RESULT_HOSTS?.trim();
  return {
    key,
    queueBase: queueBase.replace(/\/+$/, ""),
    resultHosts: hosts ? hosts.split(",").map((h) => h.trim()).filter(Boolean) : DEFAULT_FAL_RESULT_HOSTS,
    allowInsecureResultHosts: test,
  };
}

export type MeshyConfig = {
  key: string;
  apiBase: string;
  resultHosts: string[];
  allowInsecureResultHosts: boolean;
};

export const DEFAULT_MESHY_API_BASE = "https://api.meshy.ai";

/** Null → Meshy is off. As with fal, the base URL and hosts can only be changed in test mode, so a stray variable cannot send the key elsewhere. */
export function meshyConfig(): MeshyConfig | null {
  const key = process.env.MESHY_API_KEY?.trim();
  if (!key) return null;
  const test = process.env.ORBITSHELF_TEST === "1";
  const hosts = test && process.env.MESHY_RESULT_HOSTS?.trim();
  return {
    key,
    apiBase: ((test && process.env.MESHY_API_BASE_URL?.trim()) || DEFAULT_MESHY_API_BASE).replace(/\/+$/, ""),
    resultHosts: hosts ? hosts.split(",").map((h) => h.trim()).filter(Boolean) : ["assets.meshy.ai"],
    allowInsecureResultHosts: test,
  };
}
