import path from "node:path";

import fs from "fs-extra";

import { createCreateDocumentError } from "../../shared/errors.js";

export interface CreateMarkdownDocumentInput {
  targetAbsolutePath: string;
  initialContent?: string;
}

export const createMarkdownDocument = async (input: CreateMarkdownDocumentInput): Promise<void> => {
  const content = input.initialContent ?? "";

  try {
    await fs.ensureDir(path.dirname(input.targetAbsolutePath));
    await fs.writeFile(input.targetAbsolutePath, content, { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if (error && typeof error === "object") {
      const code = String((error as NodeJS.ErrnoException).code ?? "");
      if (code === "EEXIST") {
        throw createCreateDocumentError(
          "already-exists",
          "a document with the same name already exists",
          "target:already-exists",
        );
      }

      if (code === "ENOENT" || code === "EACCES" || code === "EPERM") {
        throw createCreateDocumentError(
          "unwritable-target",
          error instanceof Error ? error.message : "target is not writable",
          "target:unavailable",
        );
      }
    }

    throw createCreateDocumentError(
    "transient-io",
    error instanceof Error ? error.message : "failed to create markdown document",
    "target:temporary-failure",
  );
  }
};
