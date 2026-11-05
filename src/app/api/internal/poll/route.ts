import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { pollerTick } from "@/lib/jobs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const digest = (s: string) => createHash("sha256").update(s).digest();

/** For hosts without a long-running process: a scheduler calls this to check due jobs. Off unless CRON_SECRET is set. */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || secret.length < 32) return new NextResponse(null, { status: 404 });
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!timingSafeEqual(digest(given), digest(secret))) return new NextResponse(null, { status: 401 });
  await pollerTick();
  return new NextResponse(null, { status: 204 });
}
