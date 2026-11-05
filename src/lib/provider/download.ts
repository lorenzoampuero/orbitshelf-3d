import "server-only";
import { MAX_GLB_BYTES } from "@/lib/glb";
import { ProviderError, type Deps } from "./types";

export type ResultHosts = { resultHosts: string[]; allowInsecureResultHosts: boolean };

/** Only https on an allowed host: the URL comes from a third party and the server fetches it. No credentials are sent. */
export function isAllowedResultUrl(raw: string, c: ResultHosts): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" && !(c.allowInsecureResultHosts && u.protocol === "http:")) return false;
  if (u.username || u.password) return false;
  return c.resultHosts.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
}

/** Streams the file so an oversized one is cut off instead of filling memory. The caller validates the bytes. */
export async function downloadGlb(url: string, c: ResultHosts, deps?: Deps): Promise<Buffer> {
  if (!isAllowedResultUrl(url, c)) throw new ProviderError("invalid_response", "The provider returned a file location that is not allowed.");
  const f = deps?.fetch ?? fetch;
  let res: Response;
  try {
    res = await f(url, { signal: AbortSignal.timeout(deps?.timeoutMs ?? 120_000), cache: "no-store", redirect: "error" });
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    throw new ProviderError(name === "TimeoutError" ? "timeout" : "network", "Could not download the generated file.");
  }
  if (!res.ok) throw new ProviderError(res.status >= 500 ? "server" : "not_ready", `Result download failed (HTTP ${res.status}).`, res.status);
  if (Number(res.headers.get("content-length") ?? "0") > MAX_GLB_BYTES) throw new ProviderError("invalid_response", "Generated file is larger than the allowed maximum.");
  const reader = res.body?.getReader();
  if (!reader) throw new ProviderError("not_ready", "Empty result body.");
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_GLB_BYTES) {
      await reader.cancel();
      throw new ProviderError("invalid_response", "Generated file is larger than the allowed maximum.");
    }
    chunks.push(value);
  }
  if (total === 0) throw new ProviderError("not_ready", "The generated file is empty.");
  return Buffer.concat(chunks);
}
