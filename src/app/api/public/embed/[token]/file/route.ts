import { clientIp } from "@/lib/api";
import { refererAllowed } from "@/lib/embeds";
import { rateLimit } from "@/lib/rate-limit";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** The only way a model file leaves without a session: an active link to an approved model. */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const rl = await rateLimit(`embed-file:${clientIp(req)}`, 60, 60_000);
  if (!rl.ok) return new Response(null, { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } });
  const { token } = await params;
  const found = await store.getPublicEmbed(token);
  if (!found) return new Response(null, { status: 404 });
  if (!refererAllowed(req.headers.get("referer"), found.embed.allowedDomains, req.headers.get("x-forwarded-host") ?? req.headers.get("host"))) return new Response(null, { status: 403 });
  const data = await store.readGlb(found.embed.orgId, found.embed.modelId);
  if (!data) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": "model/gltf-binary",
      "Content-Length": String(data.length),
      // Short, so that revoking takes effect quickly even for a browser that has it cached.
      "Cache-Control": "public, max-age=60",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    },
  });
}
