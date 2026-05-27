import { describe, it, expect } from "vitest";
import { VALID_PAIRS, isValidPair } from "./validPairs";

describe("VALID_PAIRS", () => {
  it("contains 6 pairs", () => {
    expect(VALID_PAIRS).toHaveLength(6);
  });

  it("has no pair where source equals target", () => {
    for (const [source, target] of VALID_PAIRS) {
      expect(source).not.toBe(target);
    }
  });
});

describe("isValidPair", () => {
  it("returns true for all defined pairs", () => {
    for (const [source, target] of VALID_PAIRS) {
      expect(isValidPair(source, target)).toBe(true);
    }
  });

  it("returns false when source equals target", () => {
    expect(isValidPair("react", "react")).toBe(false);
    expect(isValidPair("angular", "angular")).toBe(false);
    expect(isValidPair("vue", "vue")).toBe(false);
  });
});
