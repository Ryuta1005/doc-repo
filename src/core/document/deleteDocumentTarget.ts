import path from "node:path";

import fs from "fs-extra";

import { createDeleteDocumentError } from "../../shared/errors.js";
import type { DeleteDocumentSuccessResponse } from "../../shared/types.js";
import type { FolderDeletionScopeReport } from "./inspectFolderDeletionScope.js";
import type { ResolvedDeleteTarget } from "./resolveDeleteTarget.js";

export interface DeleteDocumentTargetInput {
  resolvedTarget: ResolvedDeleteTarget;
  folderScopeReport: FolderDeletionScopeReport | null;
}

const toNativeRelative = (identifier: string): string => identifier.split(path.posix.sep).join(path.sep);

const getManagedAbsolutePath = (folderTarget: ResolvedDeleteTarget, identifier: string): string => {
  const folderPrefix = folderTarget.normalizedPath ? `${folderTarget.normalizedPath}/` : "";
  const relativeInsideFolder = folderPrefix && identifier.startsWith(folderPrefix)
    ? identifier.slice(folderPrefix.length)
    : identifier;

  return path.resolve(folderTarget.absolutePath, toNativeRelative(relativeInsideFolder));
};

const toPosixRelative = (from: string, to: string): string => path.relative(from, to).split(path.sep).join(path.posix.sep);

const removeEmptyDirectories = async (folderTarget: ResolvedDeleteTarget): Promise<string[]> => {
  const removedDirectories: string[] = [];
  const visited = new Set<string>();

  const collectDirectories = async (directory: string): Promise<void> => {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        await collectDirectories(path.join(directory, entry.name));
      }
    }
    visited.add(directory);
  };

  if (!(await fs.pathExists(folderTarget.absolutePath))) {
    return removedDirectories;
  }

  await collectDirectories(folderTarget.absolutePath);

  const directories = Array.from(visited).sort((a, b) => b.length - a.length);
  for (const directory of directories) {
    const entries = await fs.readdir(directory);
    if (entries.length > 0) {
      continue;
    }

    await fs.rmdir(directory);
    const relativeInsideTarget = toPosixRelative(folderTarget.absolutePath, directory);
    const normalized = relativeInsideTarget
      ? `${folderTarget.normalizedPath}/${relativeInsideTarget}`.replace(/^\/+|\/+$/g, "")
      : folderTarget.normalizedPath;
    removedDirectories.push(normalized);
  }

  return removedDirectories;
};

export const deleteDocumentTarget = async (
  input: DeleteDocumentTargetInput,
): Promise<Pick<DeleteDocumentSuccessResponse, "removed">> => {
  try {
    if (input.resolvedTarget.targetType === "file") {
      await fs.remove(input.resolvedTarget.absolutePath);
      return {
        removed: {
          identifiers: [input.resolvedTarget.normalizedPath],
          directories: [],
        },
      };
    }

    const report = input.folderScopeReport;
    if (!report) {
      throw createDeleteDocumentError("invalid-target", "folder scope report is required", "target:invalid");
    }

    for (const identifier of report.managedMarkdownIdentifiers) {
      await fs.remove(getManagedAbsolutePath(input.resolvedTarget, identifier));
    }

    const removedDirectories = await removeEmptyDirectories(input.resolvedTarget);

    return {
      removed: {
        identifiers: report.managedMarkdownIdentifiers,
        directories: removedDirectories,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AppError") {
      throw error;
    }

    if (error instanceof Error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        throw createDeleteDocumentError("not-found", error.message, "target:not-found");
      }
    }

    throw createDeleteDocumentError(
      "transient-io",
      error instanceof Error ? error.message : "failed to delete document target",
      "target:temporary-failure",
    );
  }
};
