import "server-only";
import { databaseUrl } from "@/lib/env";
import { pgClient, type Queryable } from "@/lib/sql";

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

/** In-memory sliding window, for a single process. */
const buckets = new Map<string, number[]>();

export function memoryRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  const cutoff = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000)) };
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) for (const [k, v] of buckets) if (v.every((t) => t <= cutoff)) buckets.delete(k);
  return { ok: true, retryAfterSeconds: 0 };
}

/** Fixed window in the database, shared by every process. */
export async function sqlRateLimit(sql: Queryable, key: string, limit: number, windowMs: number, now = Date.now()): Promise<RateLimitResult> {
  const windowStart = Math.floor(now / windowMs);
  const res = await sql.query<{ hits: unknown }>(
    `INSERT INTO public.rate_limits (key, window_start, hits) VALUES ($1, $2, 1)
     ON CONFLICT (key, window_start) DO UPDATE SET hits = public.rate_limits.hits + 1
     RETURNING hits`,
    [key, windowStart],
  );
  if (Math.random() < 0.01) await sql.query("DELETE FROM public.rate_limits WHERE window_start < $1 AND key = $2", [windowStart - 1, key]);
  if (Number(res.rows[0].hits) <= limit) return { ok: true, retryAfterSeconds: 0 };
  return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil(((windowStart + 1) * windowMs - now) / 1000)) };
}

let shared: { url: string; sql: Queryable } | null = null;

/** Uses the database when there is one. If it cannot be reached, requests are still limited per process rather than failing outright. */
export async function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): Promise<RateLimitResult> {
  const url = databaseUrl();
  if (!url) return memoryRateLimit(key, limit, windowMs, now);
  if (shared?.url !== url) shared = { url, sql: pgClient(url) };
  try {
    return await sqlRateLimit(shared.sql, key, limit, windowMs, now);
  } catch (e) {
    console.error("[rate-limit] database unavailable:", e instanceof Error ? e.message : "unknown");
    return memoryRateLimit(key, limit, windowMs, now);
  }
}

export function resetRateLimits() {
  buckets.clear();
}
