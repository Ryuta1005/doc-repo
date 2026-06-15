import { listDocuments } from "../../../application/documents/listDocuments.js";

export interface DocumentsListRouteInput {
  rootDir: string;
  scopeDir?: string;
  includePatterns?: string[];
  excludePatterns?: string[];
}

export const handleDocumentsListRoute = async (input: DocumentsListRouteInput) => {
  return await listDocuments({
    rootDir: input.rootDir,
    scopeDir: input.scopeDir,
    includePatterns: input.includePatterns,
    excludePatterns: input.excludePatterns,
  });
};
