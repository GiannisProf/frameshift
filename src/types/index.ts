export type Framework = "angular" | "react" | "vue";

export interface FingerprintItem {
  concept: string;
  original: string;
  translated: string;
  explanation: string;
  severity: "major" | "minor" | "no-equivalent";
}

export interface Warning {
  type: string;
  message: string;
  line?: number;
}

export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  lineNumber: {
    source: number | null;
    target: number | null;
  };
}

export interface TranslationResponse {
  translatedCode: string;
  fingerprint: FingerprintItem[];
  warnings: Warning[];
}
