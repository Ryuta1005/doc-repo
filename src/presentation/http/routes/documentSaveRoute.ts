import { saveDocument, toSaveFailureResponse } from "../../../application/documents/saveDocument.js";
import { createHttpError } from "../errors/httpErrorTypes.js";
import { validateSaveDocumentRequest } from "../validation/saveDocumentRequestValidator.js";

export interface DocumentSaveRouteInput {
  rootDir: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  payload: unknown;
}

export const handleDocumentSaveRoute = async (input: DocumentSaveRouteInput) => {
  const validated = validateSaveDocumentRequest(input.payload);
  if (!validated.ok) {
    throw createHttpError(400, "INVALID_REQUEST", validated.reason);
  }

  try {
    return await saveDocument({
      rootDir: input.rootDir,
      includePatterns: input.includePatterns,
      excludePatterns: input.excludePatterns,
      request: validated.value,
    });
  } catch (error) {
    return toSaveFailureResponse(error);
  }
};
