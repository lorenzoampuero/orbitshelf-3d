import { afterEach, describe, expect, it } from "vitest";
import { clientIp, readJsonCapped } from "@/lib/api";

const post = (body: string, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/x", { method: "POST", body, headers });

describe("clientIp", () => {
  afterEach(() => {
    delete process.env.TRUSTED_IP_HEADER;
  });

  it("ignores forwarding headers unless a trusted header is configured", () => {
    expect(clientIp(post("", { "x-forwarded-for": "1.2.3.4" }))).toBe("shared");
  });

  it("uses the last x-forwarded-for entry, which the trusted proxy appends", () => {
    process.env.TRUSTED_IP_HEADER = "x-forwarded-for";
    expect(clientIp(post("", { "x-forwarded-for": "6.6.6.6, 10.0.0.7" }))).toBe("10.0.0.7");
  });

  it("reads a single-value header such as x-real-ip", () => {
    process.env.TRUSTED_IP_HEADER = "X-Real-IP";
    expect(clientIp(post("", { "x-real-ip": "10.0.0.8" }))).toBe("10.0.0.8");
  });
});

describe("readJsonCapped", () => {
  it("parses a small JSON body", async () => {
    const r = await readJsonCapped(post('{"a":1}'));
    expect(r).toEqual({ ok: true, value: { a: 1 } });
  });

  it("rejects oversized bodies with 413", async () => {
    const r = await readJsonCapped(post(JSON.stringify({ note: "x".repeat(200) })), 64);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(413);
  });

  it("rejects malformed JSON with 400", async () => {
    const r = await readJsonCapped(post("{nope"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(400);
  });
});
