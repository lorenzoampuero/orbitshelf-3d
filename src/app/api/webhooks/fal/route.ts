import { NextResponse } from "next/server";
import { refreshJob } from "@/lib/jobs";
import { falWebhookKeys, verifyFalWebhook } from "@/lib/provider/fal";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 1024 * 1024;

/**
 * fal calls this when a job finishes. The delivery is only a signal: the job's real state is read again from fal, so a repeated or
 * replayed delivery cannot change a result or a balance. Polling stays active in case a delivery never arrives.
 */
export async function POST(req: Request) {
  const rawBody = Buffer.from(await req.arrayBuffer());
  if (rawBody.byteLength > MAX_BODY_BYTES) return new NextResponse(null, { status: 413 });

  let keys;
  try {
    keys = await falWebhookKeys();
  } catch {
    return new NextResponse(null, { status: 503 }); // fal retries, and polling covers the gap
  }
  const signed = verifyFalWebhook({
    requestId: req.headers.get("x-fal-webhook-request-id"),
    userId: req.headers.get("x-fal-webhook-user-id"),
    timestamp: req.headers.get("x-fal-webhook-timestamp"),
    signature: req.headers.get("x-fal-webhook-signature"),
    rawBody,
    keys,
  });
  if (!signed) return new NextResponse(null, { status: 401 });

  let requestId: unknown;
  try {
    requestId = (JSON.parse(rawBody.toString("utf8")) as { request_id?: unknown }).request_id;
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (typeof requestId !== "string") return new NextResponse(null, { status: 400 });

  const row = await store.findByProviderJob(requestId);
  if (row) await refreshJob(row.orgId, row.id).catch(() => undefined); // polling retries it
  return new NextResponse(null, { status: 204 }); // also for unknown ids, so fal stops retrying them
}
