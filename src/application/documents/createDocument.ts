import { createMarkdownDocument } from "../../core/document/createMarkdownDocument.js";
import { resolveCreateTarget } from "../../core/document/resolveCreateTarget.js";
import { toCreateDocumentUserGuidance } from "../../shared/errors.js";
import type {
  CreateDocumentRequest,
  CreateDocumentResponse,
  CreateDocumentFailureResponse,
} from "../../shared/types.js";

export interface CreateDocumentInput {
  rootDir: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  request: CreateDocumentRequest;
}

export const toCreateDocumentFailureResponse = (error: unknown): CreateDocumentFailureResponse => {
  const guidance = toCreateDocumentUserGuidance(error);

  return {
    status: "rejected",
    error: {
      code: guidance.code,
      reason: guidance.reason,
      message: guidance.message,
      retryable: guidance.retryable,
    },
  };
};

export const createDocument = async (input: CreateDocumentInput): Promise<CreateDocumentResponse> => {
  try {
    const target = await resolveCreateTarget({
      rootDir: input.rootDir,
      anchor: input.request.anchor,
      filename: input.request.filename,
      includePatterns: input.includePatterns,
      excludePatterns: input.excludePatterns,
    });

    await createMarkdownDocument({
      targetAbsolutePath: target.targetAbsolutePath,
      initialContent: "",
    });

    return {
      status: "created",
      document: {
        identifier: target.targetIdentifier,
        displayName: target.displayName,
      },
    };
  } catch (error) {
    return toCreateDocumentFailureResponse(error);
  }
};
