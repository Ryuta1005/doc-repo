import path from "node:path";

const toPosix = (value: string): string => value.split(path.sep).join(path.posix.sep);

export interface DocumentIdentifierValidationResult {
  ok: boolean;
  value?: string;
  reason?: string;
}

export const normalizeDocumentIdentifier = (rootDirRelativePath: string): string => {
  return toPosix(path.posix.normalize(rootDirRelativePath));
};

export const validateDocumentIdentifier = (rootDirRelativePath: string): DocumentIdentifierValidationResult => {
  const normalized = normalizeDocumentIdentifier(rootDirRelativePath).trim();

  if (!normalized) {
    return { ok: false, reason: "identifier must not be empty" };
  }

  if (normalized.startsWith("../") || normalized === "..") {
    return { ok: false, reason: "identifier must remain inside rootDir" };
  }

  return { ok: true, value: normalized };
};
