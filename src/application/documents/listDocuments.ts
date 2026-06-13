import path from "node:path";

import { scanMarkdown } from "../../core/scanner/scanMarkdown.js";
import { normalizeDocumentIdentifier } from "../../shared/documentIdentifier.js";

export interface ListDocumentsInput {
  rootDir: string;
  scopeDir?: string;
  includePatterns?: string[];
  excludePatterns?: string[];
}

export interface DocumentSummaryDto {
  identifier: string;
  title: string;
}

const fallbackTitleFromPath = (relativePath: string): string => {
  return path.basename(relativePath, ".md");
};

export const listDocuments = async (input: ListDocumentsInput): Promise<DocumentSummaryDto[]> => {
  const scanDir = input.scopeDir ?? input.rootDir;
  const files = await scanMarkdown(input.rootDir, scanDir, {
    includePatterns: input.includePatterns,
    excludePatterns: input.excludePatterns,
  });

  return files.map((file) => {
    const identifier = normalizeDocumentIdentifier(file.relativePath);

    return {
      identifier,
      title: fallbackTitleFromPath(file.relativePath),
    };
  });
};
