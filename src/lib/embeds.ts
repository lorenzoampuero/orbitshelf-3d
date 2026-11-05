/** Normalises what a person types ("https://www.Tienda.cl/producto") into a bare host. Returns null for anything that is not a plain host name. */
export function normalizeDomain(raw: string): string | null {
  let value = raw.trim().toLowerCase();
  if (!value) return null;
  if (!/^[a-z]+:\/\//.test(value)) value = `https://${value}`;
  let host: string;
  try {
    host = new URL(value).hostname;
  } catch {
    return null;
  }
  // At least one dot, or localhost. No wildcards, IP literals with brackets or characters that could break out of a CSP header.
  return /^(localhost|([a-z0-9-]+\.)+[a-z]{2,})$/.test(host) ? host : null;
}

/** The value of `frame-ancestors`. No domains listed means any site may embed it. The owner chooses that when creating the viewer. */
export function frameAncestors(domains: string[]): string {
  if (domains.length === 0) return "*";
  return domains.flatMap((d) => (d === "localhost" ? ["http://localhost:*"] : [`https://${d}`, `https://*.${d}`])).join(" ");
}

/** Best effort: browsers can omit the Referer. The header that really stops other sites from framing the viewer is frame-ancestors. */
export function refererAllowed(referer: string | null, domains: string[], ownHost: string | null): boolean {
  if (domains.length === 0 || !referer) return true;
  let host: string;
  try {
    host = new URL(referer).hostname.toLowerCase();
  } catch {
    return false;
  }
  if (ownHost && host === ownHost.split(":")[0].toLowerCase()) return true;
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}
