import { describe, expect, it } from "vitest";
import { csvCell, safeFilename, toCsv } from "@/lib/csv";
import { signSession, verifySession } from "@/lib/session";

describe("csv", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"');
    expect(csvCell(null)).toBe("");
    expect(csvCell(42)).toBe("42");
  });
  it.each(["=SUM(A1)", "+1+1", "-2+3", "@cmd", "\tTAB"])("neutralises formula injection: %s", (v) => {
    expect(csvCell(v).startsWith("'") || csvCell(v).startsWith('"\'')).toBe(true);
  });
  it("emits BOM, header and CRLF rows", () => {
    const out = toCsv([{ a: "x", b: 1 }], [{ key: "a", header: "A" }, { key: "b", header: "B" }]);
    expect(out).toBe("\uFEFFA,B\r\nx,1\r\n");
  });
});

describe("safeFilename", () => {
  it("strips paths and unsafe characters", () => {
    expect(safeFilename("../../etc/passwd")).toBe("passwd");
    expect(safeFilename("C:\\x\\y\\Jarrón cerámico (1).glb")).toBe("Jarron-ceramico-1-.glb");
    expect(safeFilename("   ")).toBe("model");
    expect(safeFilename("a".repeat(500)).length).toBeLessThanOrEqual(80);
  });
});

describe("session", () => {
  const user = { userId: "usr_1", orgId: "org_1", email: "a@b.co" };
  const secret = "x".repeat(40);
  it("round-trips", () => {
    expect(verifySession(signSession(user, Date.now(), secret), Date.now(), secret)).toEqual(user);
  });
  it("rejects tampering, other secrets, expiry and junk", () => {
    const t = signSession(user, Date.now(), secret);
    const [body, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ ...user, orgId: "org_2", exp: 9999999999 })).toString("base64url");
    expect(verifySession(`${forged}.${sig}`, Date.now(), secret)).toBeNull();
    expect(verifySession(t, Date.now(), "y".repeat(40))).toBeNull();
    expect(verifySession(t, Date.now() + 8 * 24 * 3600 * 1000, secret)).toBeNull();
    expect(verifySession(`${body}.`, Date.now(), secret)).toBeNull();
    expect(verifySession("junk", Date.now(), secret)).toBeNull();
    expect(verifySession(undefined, Date.now(), secret)).toBeNull();
    expect(verifySession(t + ".extra", Date.now(), secret)).toBeNull();
  });
});
