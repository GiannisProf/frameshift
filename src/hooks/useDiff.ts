import { useMemo } from "react";
import { diffLines } from "diff";
import type { DiffLine } from "../types";

export function useDiff(source: string, target: string): DiffLine[] {
  return useMemo(() => {
    const changes = diffLines(source, target);
    const result: DiffLine[] = [];
    let sourceLineNum = 1;
    let targetLineNum = 1;

    for (const change of changes) {
      const lines = change.value.split("\n");
      if (lines[lines.length - 1] === "") lines.pop();

      for (const content of lines) {
        if (change.added) {
          result.push({
            type: "added",
            content,
            lineNumber: { source: null, target: targetLineNum++ },
          });
        } else if (change.removed) {
          result.push({
            type: "removed",
            content,
            lineNumber: { source: sourceLineNum++, target: null },
          });
        } else {
          result.push({
            type: "unchanged",
            content,
            lineNumber: { source: sourceLineNum++, target: targetLineNum++ },
          });
        }
      }
    }

    return result;
  }, [source, target]);
}
