import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDiff } from "./useDiff";

describe("useDiff", () => {
  it("returns only unchanged lines for identical input", () => {
    const { result } = renderHook(() => useDiff("a\nb\n", "a\nb\n"));
    expect(result.current).toHaveLength(2);
    expect(result.current.every((l) => l.type === "unchanged")).toBe(true);
  });

  it("marks added lines with null source number", () => {
    const { result } = renderHook(() => useDiff("a\n", "a\nb\n"));
    const added = result.current.filter((l) => l.type === "added");
    expect(added).toHaveLength(1);
    expect(added[0].content).toBe("b");
    expect(added[0].lineNumber.source).toBeNull();
    expect(added[0].lineNumber.target).toBe(2);
  });

  it("marks removed lines with null target number", () => {
    const { result } = renderHook(() => useDiff("a\nb\n", "a\n"));
    const removed = result.current.filter((l) => l.type === "removed");
    expect(removed).toHaveLength(1);
    expect(removed[0].content).toBe("b");
    expect(removed[0].lineNumber.source).toBe(2);
    expect(removed[0].lineNumber.target).toBeNull();
  });

  it("assigns sequential line numbers to unchanged lines", () => {
    const { result } = renderHook(() => useDiff("a\nb\nc\n", "a\nb\nc\n"));
    result.current.forEach((line, i) => {
      expect(line.lineNumber.source).toBe(i + 1);
      expect(line.lineNumber.target).toBe(i + 1);
    });
  });

  it("returns empty array for two empty strings", () => {
    const { result } = renderHook(() => useDiff("", ""));
    expect(result.current).toHaveLength(0);
  });
});
