import { describe, expect, it } from "vitest";
import { sendMagicLink, userFromAccessToken } from "@/lib/supabase-auth";

const cfg = { url: "https://example.supabase.co", publishableKey: "sb_publishable_test" };

function fakeFetch(status: number, body: unknown, seen: { url?: string; init?: RequestInit } = {}) {
  return (async (url: string, init?: RequestInit) => {
    seen.url = url;
    seen.init = init;
    return new Response(JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
}

describe("sendMagicLink", () => {
  it("posts the email to /otp with the redirect URL and publishable key", async () => {
    const seen: { url?: string; init?: RequestInit } = {};
    const r = await sendMagicLink(cfg, "a@b.test", "http://localhost:3000/auth/callback?l=es", { fetch: fakeFetch(200, {}, seen) });
    expect(r).toBe("sent");
    expect(seen.url).toBe("https://example.supabase.co/auth/v1/otp?redirect_to=" + encodeURIComponent("http://localhost:3000/auth/callback?l=es"));
    expect((seen.init?.headers as Record<string, string>).apikey).toBe("sb_publishable_test");
    expect(JSON.parse(String(seen.init?.body))).toEqual({ email: "a@b.test", create_user: true });
  });

  it("maps 429 and other failures", async () => {
    expect(await sendMagicLink(cfg, "a@b.test", "x", { fetch: fakeFetch(429, {}) })).toBe("rate_limited");
    expect(await sendMagicLink(cfg, "a@b.test", "x", { fetch: fakeFetch(500, {}) })).toBe("error");
  });
});

describe("userFromAccessToken", () => {
  it("returns the confirmed user with a normalised email", async () => {
    const u = await userFromAccessToken(cfg, "token", { fetch: fakeFetch(200, { id: "u1", email: " A@B.Test ", email_confirmed_at: "2026-11-01" }) });
    expect(u).toEqual({ id: "u1", email: "a@b.test" });
  });

  it("rejects invalid tokens and unconfirmed emails", async () => {
    expect(await userFromAccessToken(cfg, "bad", { fetch: fakeFetch(401, { msg: "invalid" }) })).toBeNull();
    expect(await userFromAccessToken(cfg, "t", { fetch: fakeFetch(200, { id: "u1", email: "a@b.test" }) })).toBeNull();
  });
});
