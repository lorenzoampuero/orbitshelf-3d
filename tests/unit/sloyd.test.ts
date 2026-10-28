import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createImageJob, downloadResult, getJob, normalizeStatus, ProviderError, redact } from "@/lib/provider/sloyd";
import type { ProviderConfig } from "@/lib/env";

const config: ProviderConfig = {
  clientId: "client-id-123456",
  clientSecret: "TOP-SECRET-VALUE-987",
  apiBase: "https://provider.test/api",
  resultBase: "https://results.test/jobs/",
};
const glb = readFileSync(path.join(process.cwd(), "public", "demo", "chair.glb"));
const png = Buffer.from("png-bytes");
const reply = (status: number, body: unknown) => new Response(typeof body === "string" ? body : JSON.stringify(body), { status });

async function err(p: Promise<unknown>): Promise<ProviderError> {
  try {
    await p;
  } catch (e) {
    return e as ProviderError;
  }
  throw new Error("expected rejection");
}

describe("normalizeStatus", () => {
  it.each([
    ["pending", "pending"], ["created", "pending"], ["running", "running"], ["processing", "running"],
    ["success", "success"], ["completed", "success"], ["error", "error"], ["failed", "error"], ["weird-new-state", "running"], [undefined, "running"],
  ])("%s → %s", (raw, expected) => expect(normalizeStatus(raw)).toBe(expected));
});

describe("createImageJob", () => {
  it("sends multipart with file + documented options and ONLY the server credentials headers", async () => {
    const f = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => reply(200, { jobId: "01JZQY4YJ7KV1GQZ9G6H6H2X25" }));
    const out = await createImageJob({ image: png, mime: "image/png", filename: "product.png", textureResolution: "1k" }, { fetch: f as unknown as typeof fetch, config });
    expect(out.jobId).toBe("01JZQY4YJ7KV1GQZ9G6H6H2X25");
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("https://provider.test/api/jobs/image-to-3d");
    expect(init?.method).toBe("POST");
    const headers = init?.headers as Record<string, string>;
    expect(headers["x-client-id"]).toBe(config.clientId);
    expect(headers["x-client-secret"]).toBe(config.clientSecret);
    const form = init?.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    const file = form.get("file") as File;
    expect(file.name).toBe("product.png");
    expect(file.type).toBe("image/png");
    expect(form.get("textureResolution")).toBe("1k");
    expect(form.get("topology")).toBe("triangles");
    expect(form.get("targetFaceCount")).toBe("20000");
  });

  it.each([
    [402, "payment_required", true, { available: 3, error: "Payment Required", message: "Insufficient API credits", required: 20 }],
    [401, "auth", true, { statusCode: 401, message: "bad" }],
    [403, "auth", true, { statusCode: 403, message: "nope" }],
    [429, "rate_limited", true, { statusCode: 429, message: "too many" }],
    [422, "rejected", true, { statusCode: 422, message: "wrong file type" }],
    [500, "server", false, { statusCode: 500, message: "boom" }],
  ])("maps HTTP %i → %s (definite=%s)", async (status, kind, definite, body) => {
    const e = await err(createImageJob({ image: png, mime: "image/png", filename: "p.png", textureResolution: "none" }, { fetch: (async () => reply(status, body)) as unknown as typeof fetch, config }));
    expect(e).toBeInstanceOf(ProviderError);
    expect(e.kind).toBe(kind);
    expect(e.definite).toBe(definite);
    expect(e.status).toBe(status);
  });

  it("never leaks credentials in error messages, even if the provider echoes them", async () => {
    const body = { statusCode: 422, message: `bad header x-client-secret: ${config.clientSecret} id ${config.clientId}` };
    const e = await err(createImageJob({ image: png, mime: "image/png", filename: "p.png", textureResolution: "1k" }, { fetch: (async () => reply(422, body)) as unknown as typeof fetch, config }));
    expect(e.message).not.toContain(config.clientSecret);
    expect(e.message).not.toContain(config.clientId);
    expect(e.message).toContain("[redacted]");
  });

  it("treats network failure and timeout as ambiguous (not definite)", async () => {
    const boom = (async () => { throw new TypeError("fetch failed"); }) as unknown as typeof fetch;
    const e1 = await err(createImageJob({ image: png, mime: "image/png", filename: "p.png", textureResolution: "1k" }, { fetch: boom, config }));
    expect(e1.kind).toBe("network");
    expect(e1.definite).toBe(false);
    const timeout = (async () => { const x = new Error("t"); x.name = "TimeoutError"; throw x; }) as unknown as typeof fetch;
    expect((await err(createImageJob({ image: png, mime: "image/png", filename: "p.png", textureResolution: "1k" }, { fetch: timeout, config }))).kind).toBe("timeout");
  });

  it("rejects responses without a valid job id", async () => {
    for (const body of [{}, { jobId: 5 }, { jobId: "../../etc" }, "not-json"]) {
      const e = await err(createImageJob({ image: png, mime: "image/png", filename: "p.png", textureResolution: "1k" }, { fetch: (async () => reply(200, body)) as unknown as typeof fetch, config }));
      expect(e.kind).toBe("invalid_response");
    }
  });

  it("fails clearly when credentials are not configured", async () => {
    const e = await err(createImageJob({ image: png, mime: "image/png", filename: "p.png", textureResolution: "1k" }, { config: null }));
    expect(e.kind).toBe("not_configured");
  });
});

describe("getJob", () => {
  const id = "01JZQY4YJ7KV1GQZ9G6H6H2X25";
  it("normalizes documented and legacy statuses", async () => {
    for (const [raw, norm] of [["success", "success"], ["completed", "success"], ["failed", "error"], ["running", "running"]] as const) {
      const out = await getJob(id, { fetch: (async () => reply(200, { id, status: raw, errorMessage: raw === "failed" ? "oops" : undefined })) as unknown as typeof fetch, config });
      expect(out.status).toBe(norm);
    }
  });
  it("calls GET /jobs/{id} with credentials and refuses malformed ids", async () => {
    const f = vi.fn(async (_u: string | URL | Request, _i?: RequestInit) => reply(200, { status: "pending" }));
    await getJob(id, { fetch: f as unknown as typeof fetch, config });
    expect(f.mock.calls[0][0]).toBe(`https://provider.test/api/jobs/${id}`);
    expect(((f.mock.calls[0][1]?.headers) as Record<string, string>)["x-client-secret"]).toBe(config.clientSecret);
    expect((await err(getJob("../x", { config }))).kind).toBe("rejected");
  });
});

describe("downloadResult", () => {
  const id = "01JZQY4YJ7KV1GQZ9G6H6H2X25";
  it("downloads from the documented URL shape without sending credentials", async () => {
    const f = vi.fn(async (_u: string | URL | Request, _i?: RequestInit) => new Response(new Uint8Array(glb), { status: 200 }));
    const data = await downloadResult(id, { fetch: f as unknown as typeof fetch, config });
    expect(data.equals(glb)).toBe(true);
    expect(f.mock.calls[0][0]).toBe(`https://results.test/jobs/${id}.glb`);
    expect(JSON.stringify(f.mock.calls[0][1] ?? {})).not.toContain(config.clientSecret);
  });
  it("404/403 and empty bodies mean not ready", async () => {
    for (const r of [() => new Response("", { status: 404 }), () => new Response("", { status: 403 }), () => new Response(new Uint8Array(0), { status: 200 })]) {
      expect((await err(downloadResult(id, { fetch: (async () => r()) as unknown as typeof fetch, config }))).kind).toBe("not_ready");
    }
  });
});

describe("redact", () => {
  it("removes configured secrets and header echoes", () => {
    expect(redact(`oops ${config.clientSecret} and X-Client-Id: abc123`, config)).not.toMatch(/TOP-SECRET|abc123/);
  });
});
