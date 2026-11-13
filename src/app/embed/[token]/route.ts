import { clientIp } from "@/lib/api";
import { frameAncestors } from "@/lib/embeds";
import { rateLimit } from "@/lib/rate-limit";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const NOTICE = { "ai-generated": "AI-generated 3D model. It may differ from the real product.", imported: "3D model. It may differ from the real product.", "demo-sample": "Sample 3D model." } as const;

function page(status: number, html: string, ancestors: string) {
  return new Response(`<!doctype html>${html}`, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Its own header on purpose: it is the one page meant to be framed, and only by the sites its owner listed.
      "Content-Security-Policy": [
        "default-src 'none'",
        "script-src 'self' 'wasm-unsafe-eval' https://www.gstatic.com",
        "style-src 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "connect-src 'self' blob: data: https://www.gstatic.com",
        "worker-src 'self' blob:",
        "base-uri 'none'",
        "form-action 'none'",
        `frame-ancestors ${ancestors}`,
      ].join("; "),
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Robots-Tag": "noindex",
      "Cache-Control": "public, max-age=60",
    },
  });
}

const unavailable = (status: number) => page(status, `<html lang="en"><meta charset="utf-8"><title>Unavailable</title><body style="margin:0;display:grid;place-items:center;height:100vh;font:14px system-ui;color:#666">This 3D view is not available.</body></html>`, "*");

/** The public viewer. It only exists while the link is active and the model is approved: revoking, rejecting or deleting ends it. */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const rl = await rateLimit(`embed:${clientIp(req)}`, 120, 60_000);
  if (!rl.ok) return unavailable(429);
  const { token } = await params;
  const found = await store.getPublicEmbed(token);
  if (!found) return unavailable(404);
  const title = escapeHtml(found.model.title);
  const src = `/api/public/embed/${encodeURIComponent(token)}/file`;
  return page(
    200,
    `<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>html,body{margin:0;height:100%;background:transparent;font:12px/1.4 system-ui,sans-serif;color:#6b6b76}model-viewer{width:100%;height:calc(100% - 32px);--poster-color:transparent;outline:none}p{margin:0;height:32px;line-height:32px;text-align:center;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;padding:0 12px;letter-spacing:.01em}.orbit{position:absolute;left:50%;top:50%;width:84px;height:36px;margin:-18px 0 0 -42px;border:1px solid rgba(139,108,255,.55);border-radius:50%;opacity:.9}.orbit i{position:absolute;left:50%;top:-4px;width:7px;height:7px;margin-left:-3.5px;border-radius:50%;background:#8f6bff;transform-origin:50% 22px;animation:spin 1.4s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){.orbit i{animation:none}}</style>
<script type="module" src="/vendor/model-viewer.min.js"></script></head>
<body><model-viewer src="${src}" alt="${title}" camera-controls touch-action="pan-y" loading="lazy" reveal="auto" shadow-intensity="0.7"><div slot="progress-bar" class="orbit" aria-hidden="true"><i></i></div></model-viewer><p>${escapeHtml(NOTICE[found.model.provenance])}</p></body></html>`,
    frameAncestors(found.embed.allowedDomains),
  );
}
