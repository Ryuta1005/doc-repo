import path from "node:path";
import { randomUUID } from "node:crypto";

import fs from "fs-extra";

import { createSaveError } from "../../shared/errors.js";
import type { SaveNewlineStyle } from "../../shared/types.js";

export interface WriteMarkdownDocumentAtomicallyInput {
  filePath: string;
  markdownContent: string;
  newlineStyle: SaveNewlineStyle;
  hasTrailingNewline: boolean;
}

const normalizeLineEndings = (content: string, newlineStyle: SaveNewlineStyle, hasTrailingNewline: boolean): string => {
  const newline = newlineStyle === "crlf" ? "\r\n" : "\n";
  let normalized = content.replace(/\r\n|\r|\n/g, newline);

  if (hasTrailingNewline) {
    if (!normalized.endsWith(newline)) {
      normalized += newline;
    }
    return normalized;
  }

  while (normalized.endsWith(newline)) {
    normalized = normalized.slice(0, -newline.length);
  }

  return normalized;
};

export const writeMarkdownDocumentAtomically = async (input: WriteMarkdownDocumentAtomicallyInput): Promise<void> => {
  const dir = path.dirname(input.filePath);
  const tempPath = path.join(dir, `.doc-repo-${randomUUID()}.tmp`);
  const content = normalizeLineEndings(input.markdownContent, input.newlineStyle, input.hasTrailingNewline);

  await fs.ensureDir(dir);

  try {
    await fs.writeFile(tempPath, content, "utf8");
    await fs.rename(tempPath, input.filePath);
  } catch (error) {
    await fs.remove(tempPath).catch(() => undefined);
    throw createSaveError("transient-io", error instanceof Error ? error.message : "Markdown の保存に失敗しました。");
  }
};
