import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession } from "@/lib/session";
import { store } from "@/lib/store";

/** Creates (or reopens) the workspace for a verified email and sets the signed session cookie. */
export async function startSession(email: string, authUserId?: string) {
  const { user, org } = await store.signIn(email, authUserId);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSession({ userId: user.id, orgId: org.id, email: user.email }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return user;
}
