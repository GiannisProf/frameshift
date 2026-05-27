import { create } from "zustand";
import type { Framework, DiffLine, FingerprintItem, Warning } from "../types";

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

export const useAppStore = create<AppState>()(() => ({
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

  setSourceCode: () => {},
  setSourceFramework: () => {},
  setTargetFramework: () => {},
  setIsAutoDetected: () => {},
  translate: async () => {},
  toggleFingerprint: () => {},
  reset: () => {},
}));
