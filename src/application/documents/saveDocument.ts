import path from "node:path";

import fs from "fs-extra";

import { createSaveError } from "../../shared/errors.js";
import {
  type SaveRequest,
  type SaveFailureResponse,
  type SaveResponse,
  type SaveSuccessResponse,
  type SaveWarningResponse,
} from "../../shared/types.js";
import { detectUnsupportedElements } from "../../core/markdown/detectUnsupportedElements.js";
import { parseEditableMarkdown } from "../../core/markdown/parseEditableMarkdown.js";
import { serializeEditableMarkdown } from "../../core/markdown/serializeEditableMarkdown.js";
import { validateSaveTarget } from "../../core/document/validateSaveTarget.js";
import { writeMarkdownDocumentAtomically } from "../../core/document/writeMarkdownDocumentAtomically.js";

export interface SaveDocumentInput {
  rootDir: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  request: SaveRequest;
}

export const toSaveFailureResponse = (error: unknown): SaveFailureResponse => {
  if (error instanceof Error && "code" in error) {
    const code = String((error as { code?: string }).code ?? "");
    if (code === "SAVE_TARGET_INVALID") {
      return {
        status: "failed",
        error: {
          category: "invalid-target",
          code: "SAVE_TARGET_INVALID",
          message: error.message,
          retryable: false,
        },
      };
    }

    if (code === "SAVE_TARGET_UNWRITABLE") {
      return {
        status: "failed",
        error: {
          category: "unwritable-target",
          code: "SAVE_TARGET_UNWRITABLE",
          message: error.message,
          retryable: false,
        },
      };
    }

    if (code === "SAVE_IO_TEMPORARY") {
      return {
        status: "failed",
        error: {
          category: "transient-io",
          code: "SAVE_IO_TEMPORARY",
          message: error.message,
          retryable: true,
        },
      };
    }
  }

  return {
    status: "failed",
    error: {
      category: "transient-io",
      code: "SAVE_IO_TEMPORARY",
      message: error instanceof Error ? error.message : "Unknown save error",
      retryable: true,
    },
  };
};

const toWritableError = (error: unknown): never => {
  if (error instanceof Error) {
    if (
      (error as NodeJS.ErrnoException).code === "ENOENT" ||
      (error as NodeJS.ErrnoException).code === "EACCES" ||
      (error as NodeJS.ErrnoException).code === "EPERM"
    ) {
      throw createSaveError("unwritable-target", error.message);
    }

    throw createSaveError("transient-io", error.message);
  }

  throw createSaveError("transient-io", "Markdown の保存に失敗しました。");
};

export const saveDocument = async (input: SaveDocumentInput): Promise<SaveResponse> => {
  const validation = validateSaveTarget({
    rootDir: input.rootDir,
    identifier: input.request.identifier,
    includePatterns: input.includePatterns,
    excludePatterns: input.excludePatterns,
  });

  if (!validation.isValidTarget || !validation.normalizedIdentifier || !validation.absolutePath) {
    throw createSaveError("invalid-target", validation.reasons.join(", "));
  }

  const filePath = validation.absolutePath;
  const exists = await fs.pathExists(filePath);
  if (!exists) {
    throw createSaveError("unwritable-target", "対象文書が見つかりません。");
  }

  try {
    await fs.access(filePath, fs.constants.W_OK);
  } catch (error) {
    toWritableError(error);
  }

  const source = await fs.readFile(filePath, "utf8");
  const sourceDetection = detectUnsupportedElements(source);
  const parsedEditable = parseEditableMarkdown(input.request.markdownContent);
  const warnings = parsedEditable.warnings.length > 0 ? parsedEditable.warnings : sourceDetection.warnings;

  if (warnings.length > 0 && !input.request.proceed) {
    const warningResponse: SaveWarningResponse = {
      status: "warning",
      warnings,
      allowProceed: true,
    };
    return warningResponse;
  }

  const serializedMarkdown = serializeEditableMarkdown(parsedEditable.document, {
    newlineStyle: input.request.options.newlineStyle,
    hasTrailingNewline: input.request.options.hasTrailingNewline,
  });

  try {
    await writeMarkdownDocumentAtomically({
      filePath: path.resolve(filePath),
      markdownContent: serializedMarkdown,
      newlineStyle: input.request.options.newlineStyle,
      hasTrailingNewline: input.request.options.hasTrailingNewline,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AppError" && "code" in error) {
      throw error;
    }
    toWritableError(error);
  }

  const response: SaveSuccessResponse = {
    status: "saved",
    savedDocument: {
      identifier: validation.normalizedIdentifier,
    },
    warnings,
  };

  return response;
};
