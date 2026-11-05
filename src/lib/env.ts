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

export const paidAttemptCap = () => intEnv("LOCAL_PAID_ATTEMPT_CAP", 3, 0, 10_000);
export const maxActiveJobs = () => intEnv("MAX_ACTIVE_JOBS_PER_ORG", 2, 1, 5);

export function localAuthAllowed(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.ALLOW_LOCAL_AUTH === "true";
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
