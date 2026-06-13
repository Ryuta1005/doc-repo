import { validateDocumentIdentifier } from "../../../shared/documentIdentifier.js";

export const validateDocumentPathQuery = (
  rawPath: string | null,
): { ok: true; identifier: string } | { ok: false; reason: string } => {
  if (!rawPath) {
    return { ok: false, reason: "path query is required" };
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return { ok: false, reason: "path query is not a valid encoded value" };
  }

  const validated = validateDocumentIdentifier(decoded);
  if (!validated.ok || !validated.value) {
    return { ok: false, reason: validated.reason ?? "invalid path query" };
  }

  return { ok: true, identifier: validated.value };
};
