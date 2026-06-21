import path from "node:path";

import fg from "fast-glob";

import { evaluateDocumentTargetPolicy } from "./documentTargetPolicy.js";

export interface InspectFolderDeletionScopeInput {
  rootDir: string;
  folderAbsolutePath: string;
  folderRelativePath: string;
  includePatterns?: string[];
  excludePatterns?: string[];
}

export interface FolderDeletionScopeReport {
  managedMarkdownIdentifiers: string[];
  unmanagedEntries: string[];
  deletable: boolean;
}

const toPosixRelative = (rootDir: string, absolutePath: string): string => {
  return path.relative(rootDir, absolutePath).split(path.sep).join(path.posix.sep);
};

export const inspectFolderDeletionScope = async (
  input: InspectFolderDeletionScopeInput,
): Promise<FolderDeletionScopeReport> => {
  const entries = await fg(["**/*"], {
    cwd: input.folderAbsolutePath,
    dot: true,
    onlyFiles: true,
  });

  const managedMarkdownIdentifiers: string[] = [];
  const unmanagedEntries: string[] = [];

  for (const entry of entries) {
    const absolute = path.resolve(input.folderAbsolutePath, entry);
    const identifier = toPosixRelative(input.rootDir, absolute);

    const policy = evaluateDocumentTargetPolicy({
      rootDir: input.rootDir,
      identifier,
      includePatterns: input.includePatterns,
      excludePatterns: input.excludePatterns,
    });

    if (policy.reasons.length === 0 && policy.normalizedIdentifier) {
      managedMarkdownIdentifiers.push(policy.normalizedIdentifier);
    } else {
      unmanagedEntries.push(identifier);
    }
  }

  return {
    managedMarkdownIdentifiers,
    unmanagedEntries,
    deletable: unmanagedEntries.length === 0,
  };
};
