import { deleteDocument } from "../../../application/documents/deleteDocument.js";
import { createHttpError } from "../errors/httpErrorTypes.js";
import { validateDeleteDocumentRequest } from "../validation/deleteDocumentRequestValidator.js";

export interface DocumentDeleteRouteInput {
  rootDir: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  payload: unknown;
}

export const handleDocumentDeleteRoute = async (input: DocumentDeleteRouteInput) => {
  const validated = validateDeleteDocumentRequest(input.payload);
  if (!validated.ok) {
    throw createHttpError(400, "INVALID_REQUEST", validated.reason);
  }

  return await deleteDocument({
    rootDir: input.rootDir,
    includePatterns: input.includePatterns,
    excludePatterns: input.excludePatterns,
    request: validated.value,
  });
};
