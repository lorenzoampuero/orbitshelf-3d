import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { store, type ApiTokenRow } from "@/lib/store";
import type { ApiScope } from "@/lib/types";

const PREFIX = "os_";

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export function generateToken(): { token: string; hash: string; prefix: string } {
  const token = PREFIX + randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token), prefix: token.slice(0, 9) };
}

export function v1Error(status: number, code: string, message: string, headers?: Record<string, string>) {
  return NextResponse.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export const v1Json = <T>(data: T, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

/** Authenticates a request by its token. There is no cookie here, so a browser cannot be tricked into making these calls. */
export function withToken<Ctx>(scope: ApiScope, handler: (req: Request, token: ApiTokenRow, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    const raw = req.headers.get("authorization")?.match(/^Bearer\s+(os_[A-Za-z0-9_-]{20,})$/)?.[1];
    if (!raw) return v1Error(401, "unauthorized", "Send a valid token as: Authorization: Bearer <token>.");
    const token = await store.findApiToken(hashToken(raw));
    if (!token || token.revokedAt) return v1Error(401, "unauthorized", "This token is not valid.");
    if (!token.scopes.includes(scope)) return v1Error(403, "insufficient_scope", `This token does not have the ${scope} permission.`);
    const rl = await rateLimit(`api:${token.id}`, 120, 60_000);
    if (!rl.ok) return v1Error(429, "rate_limited", "Too many requests.", { "Retry-After": String(rl.retryAfterSeconds) });
    await store.touchApiToken(token.id).catch(() => undefined);
    try {
      return await handler(req, token, ctx);
    } catch (e) {
      console.error("[api/v1] unhandled error:", e instanceof Error ? e.message : "unknown");
      return v1Error(500, "internal", "Unexpected server error.");
    }
  };
}

/** Starting paid jobs through the API stays off until the terms of the engines allow it (docs/AUDITORIA_ESTADO_ACTUAL.md). */
export const apiGenerationEnabled = () => process.env.API_GENERATION_ENABLED === "true";
