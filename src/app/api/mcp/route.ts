import { NextResponse } from "next/server";
import { readBodyCapped, sameOrigin } from "@/lib/api";
import { hashToken, v1Error } from "@/lib/api-tokens";
import { handleMcpMessage, type JsonRpcMessage, type JsonRpcResponse, type McpCall } from "@/lib/mcp-server";
import { rateLimit } from "@/lib/rate-limit";
import { store } from "@/lib/store";
import { GET as getAsset } from "@/app/api/v1/assets/[id]/route";
import { GET as listAssets } from "@/app/api/v1/assets/route";
import { GET as getCredits } from "@/app/api/v1/credits/route";
import { POST as createJob } from "@/app/api/v1/jobs/route";
import { GET as listModels } from "@/app/api/v1/models/route";
import { POST as createQuote } from "@/app/api/v1/quotes/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY = 64 * 1024;
const MAX_BATCH = 10;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * The MCP server by URL (Streamable HTTP, stateless, one JSON reply per POST). An agent sends its API token as `Authorization: Bearer os_...`.
 * Each tool runs the public API's own handler in this process, with that same token, so permissions, limits and balance are exactly those of /api/v1.
 * It does not stream: there is nothing long-running to push, so GET answers 405 as the protocol allows.
 */
export async function POST(req: Request): Promise<Response> {
  // A browser page has no reason to talk to this endpoint, and a token never travels in a cookie.
  if (!sameOrigin(req)) return v1Error(403, "bad_origin", "Cross-site requests are not allowed.");
  const raw = req.headers.get("authorization")?.match(/^Bearer\s+(os_[A-Za-z0-9_-]{20,})$/)?.[1];
  const header = req.headers.get("authorization");
  const unauthorized = () => v1Error(401, "unauthorized", "Send a valid token as: Authorization: Bearer <token>.", { "WWW-Authenticate": 'Bearer realm="orbitshelf-3d"' });
  if (!raw || !header) return unauthorized();
  const token = await store.findApiToken(hashToken(raw));
  if (!token || token.revokedAt) return unauthorized();
  const rl = await rateLimit(`mcp:${token.id}`, 240, 60_000);
  if (!rl.ok) return v1Error(429, "rate_limited", "Too many requests.", { "Retry-After": String(rl.retryAfterSeconds) });

  const body = await readBodyCapped(req, MAX_BODY);
  if (!body) return v1Error(413, "too_large", "Request body is too large.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(body.toString("utf8"));
  } catch {
    return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400);
  }

  const origin = new URL(req.url).origin;
  const call: McpCall = async ({ method, path, body: payload, headers }) => {
    const init: RequestInit = { method, headers: { authorization: header, "content-type": "application/json", ...headers } };
    if (payload !== undefined) init.body = JSON.stringify(payload);
    const inner = new Request(`${origin}/api/v1${path}`, init);
    const [route, query] = path.split("?");
    let res: Response;
    if (method === "GET" && route === "/models") res = await listModels(inner, undefined);
    else if (method === "GET" && route === "/assets") res = await listAssets(inner, undefined);
    else if (method === "GET" && route === "/credits") res = await getCredits(inner, undefined);
    else if (method === "POST" && route === "/quotes") res = await createQuote(inner, undefined);
    else if (method === "POST" && route === "/jobs") res = await createJob(inner, undefined);
    else if (method === "GET" && /^\/assets\/[^/]+$/.test(route)) res = await getAsset(inner, { params: Promise.resolve({ id: decodeURIComponent(route.slice("/assets/".length)) }) });
    else throw new Error(`No such API path: ${method} ${route}${query ? "?…" : ""}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data as { error?: { message?: string } } | null)?.error?.message ?? `The API returned HTTP ${res.status}.`);
    return data;
  };

  const ctx = { call, baseUrl: origin };
  if (Array.isArray(parsed)) {
    if (parsed.length === 0 || parsed.length > MAX_BATCH) return json({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid request" } }, 400);
    const replies = (await Promise.all(parsed.map((m) => handleMcpMessage(m as JsonRpcMessage, ctx)))).filter((r): r is JsonRpcResponse => r !== null);
    return replies.length ? json(replies) : new NextResponse(null, { status: 202 });
  }
  const reply = await handleMcpMessage(parsed as JsonRpcMessage, ctx);
  return reply ? json(reply) : new NextResponse(null, { status: 202 });
}

/** No server-to-client stream and no sessions to close. */
const notAllowed = () => v1Error(405, "method_not_allowed", "This server answers POST only.", { Allow: "POST" });
export const GET = notAllowed;
export const DELETE = notAllowed;
