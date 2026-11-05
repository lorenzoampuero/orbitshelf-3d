import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import type { SessionUser } from "@/lib/types";

export type ApiErrorBody = { error: { code: string; message: string; fields?: Record<string, string> }; [k: string]: unknown };

export function apiJson<T>(data: T, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export function apiError(status: number, code: string, message: string, extra?: Record<string, unknown>, headers?: Record<string, string>) {
  const body: ApiErrorBody = { error: { code, message }, ...extra };
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export async function currentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

/** CSRF defence for cookie-authenticated mutations: a browser-supplied Origin must match the Host. */
export function sameOrigin(req: Request): boolean {
  const site = req.headers.get("sec-fetch-site");
  if (site === "cross-site") return false;
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients (curl, tests, server-to-server) do not send Origin
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

/** Wraps a route handler: same-origin check for mutations, session required (401), org-scoped user passed in. */
export function withUser<Ctx>(handler: (req: Request, user: SessionUser, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    if (!SAFE.has(req.method) && !sameOrigin(req)) return apiError(403, "bad_origin", "Cross-site requests are not allowed.");
    const user = await currentUser();
    if (!user) return apiError(401, "unauthorized", "Sign in to continue.");
    try {
      return await handler(req, user, ctx);
    } catch (e) {
      console.error("[api] unhandled error:", e instanceof Error ? e.message : "unknown");
      return apiError(500, "internal", "Unexpected server error.");
    }
  };
}

/** Reads a request body with a hard byte cap, aborting early instead of buffering unbounded uploads. */
export async function readBodyCapped(req: Request, maxBytes: number): Promise<Buffer | null> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > maxBytes) return null;
  const reader = req.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export const MAX_JSON_BYTES = 16 * 1024;

/** Capped JSON body read: returns the parsed value, or a ready-made 413/400 error response. */
export async function readJsonCapped(req: Request, maxBytes = MAX_JSON_BYTES): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  const raw = await readBodyCapped(req, maxBytes);
  if (!raw) return { ok: false, response: apiError(413, "too_large", "Request body is too large.") };
  try {
    return { ok: true, value: JSON.parse(raw.toString("utf8")) };
  } catch {
    return { ok: false, response: apiError(400, "invalid_json", "Invalid JSON body.") };
  }
}

/**
 * Client IP for rate limiting. Forwarding headers are client-controlled unless a trusted proxy overwrites them,
 * so they are only read when TRUSTED_IP_HEADER names the header your platform sets (e.g. "x-real-ip").
 * Without it every client shares one bucket: stricter, but impossible to bypass by spoofing a header.
 */
export function clientIp(req: Request): string {
  const header = process.env.TRUSTED_IP_HEADER?.trim().toLowerCase();
  if (!header) return "shared";
  const value = req.headers.get(header);
  // For x-forwarded-for the trusted proxy appends the real address last; earlier entries are client-supplied.
  const ip = value?.split(",").pop()?.trim();
  return ip && ip.length <= 64 ? ip : "unknown";
}
