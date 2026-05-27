import { describe, it, expect } from "vitest";
import { parseResponse } from "./parseResponse";

const valid = {
  translatedCode: "export function Foo() { return <div />; }",
  fingerprint: [],
  warnings: [],
};

describe("parseResponse", () => {
  it("parses valid JSON", () => {
    const result = parseResponse(JSON.stringify(valid));
    expect(result.translatedCode).toBe(valid.translatedCode);
    expect(result.fingerprint).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("strips ```json fences", () => {
    const fenced = `\`\`\`json\n${JSON.stringify(valid)}\n\`\`\``;
    expect(parseResponse(fenced).translatedCode).toBe(valid.translatedCode);
  });

  it("strips plain ``` fences", () => {
    const fenced = `\`\`\`\n${JSON.stringify(valid)}\n\`\`\``;
    expect(parseResponse(fenced).translatedCode).toBe(valid.translatedCode);
  });

  it("throws parse_error on invalid JSON", () => {
    expect(() => parseResponse("not json")).toThrow("parse_error");
  });

  it("throws parse_error when translatedCode is missing", () => {
    expect(() => parseResponse(JSON.stringify({ fingerprint: [], warnings: [] }))).toThrow(
      "parse_error",
    );
  });

  it("throws parse_error when fingerprint is missing", () => {
    expect(() => parseResponse(JSON.stringify({ translatedCode: "x", warnings: [] }))).toThrow(
      "parse_error",
    );
  });

  it("throws parse_error when warnings is missing", () => {
    expect(() => parseResponse(JSON.stringify({ translatedCode: "x", fingerprint: [] }))).toThrow(
      "parse_error",
    );
  });

  it("throws parse_error for null", () => {
    expect(() => parseResponse("null")).toThrow("parse_error");
  });
});
