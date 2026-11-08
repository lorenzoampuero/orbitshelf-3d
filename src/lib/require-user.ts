import "server-only";
import { redirect } from "next/navigation";
import { localePath } from "@/i18n/config";
import { currentUser } from "@/lib/api";
import type { Locale, SessionUser } from "@/lib/types";

/**
 * The dashboard layout redirects visitors who are not signed in, but Next renders a layout and its page at the same time,
 * so a page can run first with no session. Pages call this instead of assuming a user, and send the visitor to sign in.
 */
export async function requireUser(locale: Locale): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect(localePath(locale, "/login"));
  return user;
}
