import { deleteDocumentTarget } from "../../core/document/deleteDocumentTarget.js";
import { inspectFolderDeletionScope } from "../../core/document/inspectFolderDeletionScope.js";
import { resolveDeleteTarget } from "../../core/document/resolveDeleteTarget.js";
import { toDeleteDocumentUserGuidance } from "../../shared/errors.js";
import type {
  DeleteDocumentFailureResponse,
  DeleteDocumentRequest,
  DeleteDocumentResponse,
} from "../../shared/types.js";

export interface DeleteDocumentInput {
  rootDir: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  request: DeleteDocumentRequest;
}

export const toDeleteDocumentFailureResponse = (error: unknown): DeleteDocumentFailureResponse => {
  const guidance = toDeleteDocumentUserGuidance(error);

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

export const deleteDocument = async (input: DeleteDocumentInput): Promise<DeleteDocumentResponse> => {
  try {
    const resolvedTarget = await resolveDeleteTarget({
      rootDir: input.rootDir,
      target: input.request.target,
      includePatterns: input.includePatterns,
      excludePatterns: input.excludePatterns,
    });

    const folderScopeReport =
      resolvedTarget.targetType === "folder"
        ? await inspectFolderDeletionScope({
            rootDir: input.rootDir,
            folderAbsolutePath: resolvedTarget.absolutePath,
            folderRelativePath: resolvedTarget.normalizedPath,
            includePatterns: input.includePatterns,
            excludePatterns: input.excludePatterns,
          })
        : null;

    const deleted = await deleteDocumentTarget({
      resolvedTarget,
      folderScopeReport,
    });

    return {
      status: "deleted",
      removed: deleted.removed,
    };
  } catch (error) {
    return toDeleteDocumentFailureResponse(error);
  }
};
