import { createDocument } from "../../../application/documents/createDocument.js";
import { createHttpError } from "../errors/httpErrorTypes.js";
import { validateCreateDocumentRequest } from "../validation/createDocumentRequestValidator.js";

export interface DocumentCreateRouteInput {
  rootDir: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  payload: unknown;
}

export const handleDocumentCreateRoute = async (input: DocumentCreateRouteInput) => {
  const validated = validateCreateDocumentRequest(input.payload);
  if (!validated.ok) {
    throw createHttpError(400, "INVALID_REQUEST", validated.reason);
  }

  return await createDocument({
    rootDir: input.rootDir,
    includePatterns: input.includePatterns,
    excludePatterns: input.excludePatterns,
    request: validated.value,
  });
};
