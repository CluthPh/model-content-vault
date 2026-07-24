import { describe, expect, it } from "vitest";
import { isValidAccessCode, normalizeAccessCode } from "@/lib/access-code";

describe("access codes", () => {
  it("normalizes case, spaces and separators", () => {
    expect(normalizeAccessCode("  YKZ-AB 12_34 ")).toBe("ykzab1234");
  });

  it("accepts legacy six-character codes during migration", () => {
    expect(isValidAccessCode("ABC123")).toBe(true);
  });

  it("rejects short and excessively long values", () => {
    expect(isValidAccessCode("12345")).toBe(false);
    expect(isValidAccessCode("A".repeat(65))).toBe(false);
  });
});
