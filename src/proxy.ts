import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Locale routing without a library: English lives at "/", Spanish at "/es".
 * Every page lives under app/[locale]; English requests are rewritten to /en/... internally.
 * API routes, Next internals and static files are untouched.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/en" ||
    pathname.startsWith("/en/") ||
    pathname === "/es" ||
    pathname.startsWith("/es/")
  ) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/en" + (pathname === "/" ? "" : pathname);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|embed|vendor|_next|demo|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
};
