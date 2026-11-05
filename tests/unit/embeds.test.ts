import { describe, expect, it } from "vitest";
import { frameAncestors, normalizeDomain, refererAllowed } from "@/lib/embeds";

describe("allowed sites for a public viewer", () => {
  it("reduces what people type to a bare host", () => {
    expect(normalizeDomain("https://www.MiTienda.cl/producto?x=1")).toBe("www.mitienda.cl");
    expect(normalizeDomain("mitienda.cl")).toBe("mitienda.cl");
    expect(normalizeDomain("  shop.example.co.uk ")).toBe("shop.example.co.uk");
    expect(normalizeDomain("localhost:3000")).toBe("localhost");
  });

  it("refuses anything that could break out of the CSP header or match too much", () => {
    for (const bad of ["", "not a domain!", "*.mitienda.cl", "*", "mitienda", "a.cl; script-src *", "javascript:alert(1)", "https://[::1]/", "192.168.0.1"]) {
      expect(normalizeDomain(bad), bad).toBeNull();
    }
  });

  it("builds frame-ancestors: any site only when none is listed, https only otherwise", () => {
    expect(frameAncestors([])).toBe("*");
    expect(frameAncestors(["mitienda.cl"])).toBe("https://mitienda.cl https://*.mitienda.cl");
    expect(frameAncestors(["a.cl", "b.cl"])).toBe("https://a.cl https://*.a.cl https://b.cl https://*.b.cl");
  });

  it("checks the Referer when there is one, without confusing similar names", () => {
    const domains = ["mitienda.cl"];
    expect(refererAllowed(null, domains, "app.test")).toBe(true); // browsers may omit it; frame-ancestors is what really stops framing
    expect(refererAllowed("https://mitienda.cl/p", domains, "app.test")).toBe(true);
    expect(refererAllowed("https://www.mitienda.cl/p", domains, "app.test")).toBe(true);
    expect(refererAllowed("https://app.test:3000/embed/x", domains, "app.test:3000")).toBe(true); // the viewer page itself
    expect(refererAllowed("https://evilmitienda.cl/p", domains, "app.test")).toBe(false);
    expect(refererAllowed("https://mitienda.cl.evil.test/p", domains, "app.test")).toBe(false);
    expect(refererAllowed("not a url", domains, "app.test")).toBe(false);
    expect(refererAllowed("https://anything.test/", [], "app.test")).toBe(true);
  });
});
