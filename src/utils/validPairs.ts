import type { Framework } from "../types";

export const VALID_PAIRS: [Framework, Framework][] = [
  ["angular", "react"],
  ["react", "angular"],
  ["react", "vue"],
  ["vue", "react"],
  ["angular", "vue"],
  ["vue", "angular"],
];

export function isValidPair(source: Framework, target: Framework): boolean {
  return VALID_PAIRS.some(([s, t]) => s === source && t === target);
}
