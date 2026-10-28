import { cookies } from "next/headers";
import { apiError, apiJson, sameOrigin } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return apiError(403, "bad_origin", "Cross-site requests are not allowed.");
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return apiJson({ ok: true });
}
