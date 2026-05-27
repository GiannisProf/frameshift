import { create } from "zustand";
import { diffLines } from "diff";
import type { Framework, DiffLine, FingerprintItem, Warning } from "../types";
import { isValidPair } from "../utils/validPairs";
import { parseResponse } from "../utils/parseResponse";

interface AppState {
  sourceCode: string;
  sourceFramework: Framework | null;
  targetFramework: Framework | null;
  isAutoDetected: boolean;

  translatedCode: string | null;
  diffLines: DiffLine[];
  fingerprint: FingerprintItem[];
  warnings: Warning[];

  isLoading: boolean;
  loadingMessage: string;
  isFingerprintOpen: boolean;
  error: string | null;

  setSourceCode: (code: string) => void;
  setSourceFramework: (f: Framework) => void;
  setTargetFramework: (f: Framework) => void;
  setIsAutoDetected: (v: boolean) => void;
  translate: () => Promise<void>;
  toggleFingerprint: () => void;
  reset: () => void;
}

const LOADING_MESSAGES = [
  "Analyzing component structure...",
  "Mapping framework concepts...",
  "Translating patterns...",
  "Building fingerprint...",
] as const;

function computeDiffLines(source: string, target: string): DiffLine[] {
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
}

export const useAppStore = create<AppState>()((set, get) => ({
  sourceCode: "",
  sourceFramework: null,
  targetFramework: null,
  isAutoDetected: false,
  translatedCode: null,
  diffLines: [],
  fingerprint: [],
  warnings: [],
  isLoading: false,
  loadingMessage: "",
  isFingerprintOpen: false,
  error: null,

  setSourceCode: (code) => set({ sourceCode: code, error: null }),
  setSourceFramework: (f) => set({ sourceFramework: f, error: null }),
  setTargetFramework: (f) => set({ targetFramework: f, error: null }),
  setIsAutoDetected: (v) => set({ isAutoDetected: v }),

  translate: async () => {
    const { sourceCode, sourceFramework, targetFramework } = get();

    if (!sourceCode.trim()) {
      set({ error: "Please paste a component to translate." });
      return;
    }

    if (!sourceFramework || !targetFramework || !isValidPair(sourceFramework, targetFramework)) {
      set({ error: "Source and target frameworks must be different." });
      return;
    }

    set({ isLoading: true, error: null, loadingMessage: LOADING_MESSAGES[0] });

    let msgIndex = 0;
    const interval = setInterval(() => {
      msgIndex++;
      if (msgIndex < LOADING_MESSAGES.length) {
        set({ loadingMessage: LOADING_MESSAGES[msgIndex] });
      }
    }, 2000);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceFramework, targetFramework, sourceCode }),
      });

      clearInterval(interval);

      if (!response.ok) {
        set({
          isLoading: false,
          loadingMessage: "",
          error: "Translation failed. Please try again.",
        });
        return;
      }

      const json = (await response.json()) as { raw?: string };
      if (!json.raw) {
        set({
          isLoading: false,
          loadingMessage: "",
          error: "Translation failed. Please try again.",
        });
        return;
      }

      const parsed = parseResponse(json.raw);

      set({
        isLoading: false,
        loadingMessage: "",
        translatedCode: parsed.translatedCode,
        diffLines: computeDiffLines(sourceCode, parsed.translatedCode),
        fingerprint: parsed.fingerprint,
        warnings: parsed.warnings,
        isFingerprintOpen: true,
        error: null,
      });
    } catch (err) {
      clearInterval(interval);
      const isParseError = err instanceof Error && err.message === "parse_error";
      set({
        isLoading: false,
        loadingMessage: "",
        error: isParseError
          ? "Received an unexpected response. Please try again."
          : "Network error. Check your connection and try again.",
      });
    }
  },

  toggleFingerprint: () => set((s) => ({ isFingerprintOpen: !s.isFingerprintOpen })),

  reset: () =>
    set({
      sourceCode: "",
      sourceFramework: null,
      targetFramework: null,
      isAutoDetected: false,
      translatedCode: null,
      diffLines: [],
      fingerprint: [],
      warnings: [],
      isLoading: false,
      loadingMessage: "",
      isFingerprintOpen: false,
      error: null,
    }),
}));
