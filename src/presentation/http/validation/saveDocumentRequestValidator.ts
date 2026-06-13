import type { SaveNewlineStyle, SaveRequest } from "../../../shared/types.js";

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isSaveNewlineStyle = (value: unknown): value is SaveNewlineStyle => {
  return value === "lf" || value === "crlf";
};

export const validateSaveDocumentRequest = (
  payload: unknown,
): { ok: true; value: SaveRequest } | { ok: false; reason: string } => {
  if (!isPlainObject(payload)) {
    return { ok: false, reason: "request body must be a JSON object" };
  }

  const { identifier, markdownContent, options, proceed } = payload;

  if (typeof identifier !== "string" || !identifier.trim()) {
    return { ok: false, reason: "identifier is required" };
  }

  if (typeof markdownContent !== "string") {
    return { ok: false, reason: "markdownContent is required" };
  }

  if (!isPlainObject(options)) {
    return { ok: false, reason: "options is required" };
  }

  if (!isSaveNewlineStyle(options.newlineStyle)) {
    return { ok: false, reason: "options.newlineStyle must be lf or crlf" };
  }

  if (typeof options.hasTrailingNewline !== "boolean") {
    return { ok: false, reason: "options.hasTrailingNewline is required" };
  }

  if (proceed !== undefined && typeof proceed !== "boolean") {
    return { ok: false, reason: "proceed must be boolean when provided" };
  }

  return {
    ok: true,
    value: {
      identifier,
      markdownContent,
      options: {
        newlineStyle: options.newlineStyle,
        hasTrailingNewline: options.hasTrailingNewline,
      },
      proceed,
    },
  };
};
