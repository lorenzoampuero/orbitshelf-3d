"use client";

import { useEffect } from "react";

/**
 * If Supabase falls back to the Site URL (redirect not on its allow list), the sign-in tokens land on whatever page
 * that is. Forward them to the callback page, which consumes them and clears the URL.
 */
export function AuthHashRedirect() {
  useEffect(() => {
    const { hash, pathname } = window.location;
    if (!/[#&](access_token|error_description)=/.test(hash)) return;
    if (pathname.endsWith("/auth/callback")) return;
    const locale = pathname === "/es" || pathname.startsWith("/es/") ? "es" : "en";
    window.location.replace(`/auth/callback?l=${locale}${hash}`);
  }, []);
  return null;
}
