export type FilenameValidationReason = "required" | "path-segment" | "path-separator" | "empty-display-name";

export interface NormalizedMarkdownFilename {
  filenameWithExtension: string;
  displayName: string;
}

export type NormalizeMarkdownFilenameResult =
  | { ok: true; value: NormalizedMarkdownFilename }
  | { ok: false; reason: FilenameValidationReason };

export const normalizeMarkdownFilenameInput = (filename: string): NormalizeMarkdownFilenameResult => {
  const trimmed = filename.trim();
  if (!trimmed) {
    return { ok: false, reason: "required" };
  }

  if (trimmed === "." || trimmed === "..") {
    return { ok: false, reason: "path-segment" };
  }

  if (trimmed.includes("/") || trimmed.includes("\\")) {
    return { ok: false, reason: "path-separator" };
  }

  const filenameWithExtension = `${trimmed}.md`;
  const displayName = filenameWithExtension.replace(/\.md$/i, "");

  if (!displayName.trim()) {
    return { ok: false, reason: "empty-display-name" };
  }

  return {
    ok: true,
    value: {
      filenameWithExtension,
      displayName,
    },
  };
};
