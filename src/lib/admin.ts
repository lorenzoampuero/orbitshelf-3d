import "server-only";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/api";
import type { SessionUser } from "@/lib/types";

/**
 * Who may open the admin panel. A comma-separated list of emails in ADMIN_EMAILS, compared after trimming and lowercasing.
 * With the variable empty there are no administrators: the panel answers as if it did not exist.
 */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const isAdminEmail = (email: string | null | undefined): boolean => Boolean(email) && adminEmails().includes(email!.trim().toLowerCase());

export const isAdminUser = (user: SessionUser | null): boolean => (user ? isAdminEmail(user.email) : false);

/** For pages: a visitor who is not an administrator gets the same 404 as any page that does not exist. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await currentUser();
  if (!isAdminUser(user)) notFound();
  return user!;
}
