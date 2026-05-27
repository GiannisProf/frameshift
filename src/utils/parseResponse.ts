import type { TranslationResponse } from "../types";

export function parseResponse(raw: string): TranslationResponse {
  const stripped = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    throw new Error("parse_error");
  }

  if (!isTranslationResponse(parsed)) {
    throw new Error("parse_error");
  }

  return parsed;
}

function isTranslationResponse(v: unknown): v is TranslationResponse {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.translatedCode === "string" &&
    Array.isArray(obj.fingerprint) &&
    Array.isArray(obj.warnings)
  );
}
