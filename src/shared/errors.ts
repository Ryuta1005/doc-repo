import type { CreateFailureReason, DeleteFailureReason } from "./types.js";

export class AppError extends Error {
  public readonly code: string;
  public readonly hint: string;
  public readonly reasonCode?: string;

  public constructor(message: string, code: string, hint: string, reasonCode?: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.hint = hint;
    this.reasonCode = reasonCode;
  }
}

export type ServeFailureCode = "invalid-port" | "port-conflict" | "unknown";

export type SaveFailureCode = "invalid-target" | "unwritable-target" | "transient-io";

export type CreateFailureCode =
  | "invalid-input"
  | "out-of-scope"
  | "already-exists"
  | "unwritable-target"
  | "transient-io";

export type DeleteFailureCode =
  | "invalid-target"
  | "out-of-scope"
  | "not-found"
  | "contains-unmanaged-content"
  | "transient-io";

const serveFailureCatalog: Record<ServeFailureCode, { code: string; hint: string }> = {
  "invalid-port": {
    code: "INVALID_PORT",
    hint: "Specify port as an integer from 1 to 65535.",
  },
  "port-conflict": {
    code: "PORT_CONFLICT",
    hint: "Specify a different port or stop the process currently using it.",
  },
  unknown: {
    code: "UNKNOWN",
    hint: "Check the detailed logs and run the command again.",
  },
};

export const createServeError = (type: ServeFailureCode, message: string): AppError => {
  const spec = serveFailureCatalog[type];
  return new AppError(message, spec.code, spec.hint);
};

export const toServeUserGuidance = (
  error: unknown,
): { type: ServeFailureCode; reason: string; hint: string; field?: string } => {
  if (error instanceof AppError) {
    if (error.code === "INVALID_PORT" || error.code === "CONFIG_INVALID_PORT") {
      return {
        type: "invalid-port",
        reason: `${error.code}: ${error.message}`,
        hint: error.hint,
        field: "port",
      };
    }

    if (error.code === "CONFIG_INVALID_PATTERN") {
      return {
        type: "unknown",
        reason: `${error.code}: ${error.message}`,
        hint: error.hint,
        field: "include/exclude",
      };
    }

    if (
      error.code === "CONFIG_INVALID_ROOT_DIR" ||
      error.code === "CONFIG_ROOT_DIR_NOT_FOUND" ||
      error.code === "CONFIG_ROOT_DIR_NOT_DIRECTORY"
    ) {
      return {
        type: "unknown",
        reason: `${error.code}: ${error.message}`,
        hint: error.hint,
        field: "rootDir",
      };
    }

    if (error.code === "PORT_CONFLICT") {
      return {
        type: "port-conflict",
        reason: `${error.code}: ${error.message}`,
        hint: error.hint,
      };
    }

    return {
      type: "unknown",
      reason: `${error.code}: ${error.message}`,
      hint: error.hint,
    };
  }

  if (error instanceof Error) {
    return {
      type: "unknown",
      reason: error.message,
      hint: serveFailureCatalog.unknown.hint,
    };
  }

  return {
    type: "unknown",
    reason: "Unknown error",
    hint: serveFailureCatalog.unknown.hint,
  };
};

export const toUserGuidance = (error: unknown): { reason: string; hint: string } => {
  if (error instanceof AppError) {
    return {
      reason: `${error.code}: ${error.message}`,
      hint: error.hint,
    };
  }

  if (error instanceof Error) {
    return {
      reason: error.message,
      hint: "Check the working directory permissions and input files, then run the command again.",
    };
  }

  return {
    reason: "Unknown error",
    hint: "Check the detailed logs and run the command again if the issue is resolved.",
  };
};

const saveFailureCatalog: Record<SaveFailureCode, { code: string; hint: string; retryable: boolean }> = {
  "invalid-target": {
    code: "SAVE_TARGET_INVALID",
    hint: "Check that the save target is a .md file under rootDir and satisfies include/exclude rules and path format.",
    retryable: false,
  },
  "unwritable-target": {
    code: "SAVE_TARGET_UNWRITABLE",
    hint: "Check that the target document exists and is writable.",
    retryable: false,
  },
  "transient-io": {
    code: "SAVE_IO_TEMPORARY",
    hint: "This may be a temporary I/O failure. Try again.",
    retryable: true,
  },
};

export const createSaveError = (type: SaveFailureCode, message: string): AppError => {
  const spec = saveFailureCatalog[type];
  return new AppError(message, spec.code, spec.hint);
};

export const toSaveUserGuidance = (
  error: unknown,
): { category: SaveFailureCode; code: string; message: string; retryable: boolean; hint: string } => {
  if (error instanceof AppError) {
    if (error.code === "SAVE_TARGET_INVALID") {
      const spec = saveFailureCatalog["invalid-target"];
      return {
        category: "invalid-target",
        code: error.code,
        message: error.message,
        retryable: spec.retryable,
        hint: error.hint,
      };
    }

    if (error.code === "SAVE_TARGET_UNWRITABLE") {
      const spec = saveFailureCatalog["unwritable-target"];
      return {
        category: "unwritable-target",
        code: error.code,
        message: error.message,
        retryable: spec.retryable,
        hint: error.hint,
      };
    }

    if (error.code === "SAVE_IO_TEMPORARY") {
      const spec = saveFailureCatalog["transient-io"];
      return {
        category: "transient-io",
        code: error.code,
        message: error.message,
        retryable: spec.retryable,
        hint: error.hint,
      };
    }
  }

  const spec = saveFailureCatalog["transient-io"];
  return {
    category: "transient-io",
    code: spec.code,
    message: error instanceof Error ? error.message : "Unknown save error",
    retryable: spec.retryable,
    hint: spec.hint,
  };
};

const createFailureCatalog: Record<CreateFailureCode, { code: string; hint: string; retryable: boolean }> = {
  "invalid-input": {
    code: "INVALID_INPUT",
    hint: "Use a single filename only. Path separators and path segments are not supported.",
    retryable: false,
  },
  "out-of-scope": {
    code: "OUT_OF_SCOPE",
    hint: "The target must remain inside rootDir and satisfy include/exclude rules.",
    retryable: false,
  },
  "already-exists": {
    code: "ALREADY_EXISTS",
    hint: "A document with the same name already exists. Use another filename.",
    retryable: false,
  },
  "unwritable-target": {
    code: "UNWRITABLE_TARGET",
    hint: "Check parent directory existence and write permissions.",
    retryable: false,
  },
  "transient-io": {
    code: "TRANSIENT_IO",
    hint: "A temporary I/O error occurred. Try again.",
    retryable: true,
  },
};

export const createCreateDocumentError = (
  type: CreateFailureCode,
  message: string,
  reason?: CreateFailureReason,
): AppError => {
  const spec = createFailureCatalog[type];
  return new AppError(message, spec.code, spec.hint, reason);
};

const isCreateFailureReason = (value: string | undefined): value is CreateFailureReason => {
  return (
    value === "filename:required" ||
    value === "filename:path-segment" ||
    value === "filename:path-separator" ||
    value === "filename:empty-display-name" ||
    value === "filename:invalid" ||
    value === "target:out-of-scope" ||
    value === "target:already-exists" ||
    value === "target:unavailable" ||
    value === "target:temporary-failure"
  );
};

const resolveCreateFailureReason = (code: string, reasonCode: string | undefined): CreateFailureReason => {
  if (isCreateFailureReason(reasonCode)) {
    return reasonCode;
  }

  if (code === "INVALID_INPUT") {
    return "filename:invalid";
  }
  if (code === "ALREADY_EXISTS") {
    return "target:already-exists";
  }
  if (code === "OUT_OF_SCOPE") {
    return "target:out-of-scope";
  }
  if (code === "UNWRITABLE_TARGET") {
    return "target:unavailable";
  }

  return "target:temporary-failure";
};

export const toCreateDocumentUserGuidance = (
  error: unknown,
): {
  code: "INVALID_INPUT" | "OUT_OF_SCOPE" | "ALREADY_EXISTS" | "UNWRITABLE_TARGET" | "TRANSIENT_IO";
  reason: CreateFailureReason;
  message: string;
  retryable: boolean;
  hint: string;
} => {
  if (error instanceof AppError) {
    if (error.code === "INVALID_INPUT") {
      const spec = createFailureCatalog["invalid-input"];
      return {
        code: "INVALID_INPUT",
        reason: resolveCreateFailureReason(error.code, error.reasonCode),
        message: error.message,
        retryable: spec.retryable,
        hint: error.hint,
      };
    }
    if (error.code === "OUT_OF_SCOPE") {
      const spec = createFailureCatalog["out-of-scope"];
      return {
        code: "OUT_OF_SCOPE",
        reason: resolveCreateFailureReason(error.code, error.reasonCode),
        message: error.message,
        retryable: spec.retryable,
        hint: error.hint,
      };
    }
    if (error.code === "ALREADY_EXISTS") {
      const spec = createFailureCatalog["already-exists"];
      return {
        code: "ALREADY_EXISTS",
        reason: resolveCreateFailureReason(error.code, error.reasonCode),
        message: error.message,
        retryable: spec.retryable,
        hint: error.hint,
      };
    }
    if (error.code === "UNWRITABLE_TARGET") {
      const spec = createFailureCatalog["unwritable-target"];
      return {
        code: "UNWRITABLE_TARGET",
        reason: resolveCreateFailureReason(error.code, error.reasonCode),
        message: error.message,
        retryable: spec.retryable,
        hint: error.hint,
      };
    }
  }

  const spec = createFailureCatalog["transient-io"];
  return {
    code: "TRANSIENT_IO",
    reason: "target:temporary-failure",
    message: error instanceof Error ? error.message : "Unknown create-document error",
    retryable: spec.retryable,
    hint: spec.hint,
  };
};

const deleteFailureCatalog: Record<DeleteFailureCode, { code: string; hint: string; retryable: boolean }> = {
  "invalid-target": {
    code: "INVALID_TARGET",
    hint: "Check target type and path. File targets must be markdown under rootDir.",
    retryable: false,
  },
  "out-of-scope": {
    code: "OUT_OF_SCOPE",
    hint: "The target must remain inside rootDir and satisfy include/exclude rules.",
    retryable: false,
  },
  "not-found": {
    code: "NOT_FOUND",
    hint: "The target no longer exists. Refresh the document list and try again.",
    retryable: false,
  },
  "contains-unmanaged-content": {
    code: "CONTAINS_UNMANAGED_CONTENT",
    hint: "Folder deletion is blocked when unmanaged or out-of-scope entries are found.",
    retryable: false,
  },
  "transient-io": {
    code: "TRANSIENT_IO",
    hint: "A temporary I/O error occurred. Try again.",
    retryable: true,
  },
};

export const createDeleteDocumentError = (
  type: DeleteFailureCode,
  message: string,
  reason?: DeleteFailureReason,
): AppError => {
  const spec = deleteFailureCatalog[type];
  return new AppError(message, spec.code, spec.hint, reason);
};

const isDeleteFailureReason = (value: string | undefined): value is DeleteFailureReason => {
  return (
    value === "target:invalid" ||
    value === "target:out-of-scope" ||
    value === "target:not-found" ||
    value === "folder:contains-unmanaged-content" ||
    value === "target:temporary-failure"
  );
};

const resolveDeleteFailureReason = (code: string, reasonCode: string | undefined): DeleteFailureReason => {
  if (isDeleteFailureReason(reasonCode)) {
    return reasonCode;
  }

  if (code === "INVALID_TARGET") {
    return "target:invalid";
  }
  if (code === "OUT_OF_SCOPE") {
    return "target:out-of-scope";
  }
  if (code === "NOT_FOUND") {
    return "target:not-found";
  }
  if (code === "CONTAINS_UNMANAGED_CONTENT") {
    return "folder:contains-unmanaged-content";
  }

  return "target:temporary-failure";
};

export const toDeleteDocumentUserGuidance = (
  error: unknown,
): {
  code: "INVALID_TARGET" | "OUT_OF_SCOPE" | "NOT_FOUND" | "CONTAINS_UNMANAGED_CONTENT" | "TRANSIENT_IO";
  reason: DeleteFailureReason;
  message: string;
  retryable: boolean;
  hint: string;
} => {
  if (error instanceof AppError) {
    if (error.code === "INVALID_TARGET") {
      const spec = deleteFailureCatalog["invalid-target"];
      return {
        code: "INVALID_TARGET",
        reason: resolveDeleteFailureReason(error.code, error.reasonCode),
        message: error.message,
        retryable: spec.retryable,
        hint: error.hint,
      };
    }
    if (error.code === "OUT_OF_SCOPE") {
      const spec = deleteFailureCatalog["out-of-scope"];
      return {
        code: "OUT_OF_SCOPE",
        reason: resolveDeleteFailureReason(error.code, error.reasonCode),
        message: error.message,
        retryable: spec.retryable,
        hint: error.hint,
      };
    }
    if (error.code === "NOT_FOUND") {
      const spec = deleteFailureCatalog["not-found"];
      return {
        code: "NOT_FOUND",
        reason: resolveDeleteFailureReason(error.code, error.reasonCode),
        message: error.message,
        retryable: spec.retryable,
        hint: error.hint,
      };
    }
    if (error.code === "CONTAINS_UNMANAGED_CONTENT") {
      const spec = deleteFailureCatalog["contains-unmanaged-content"];
      return {
        code: "CONTAINS_UNMANAGED_CONTENT",
        reason: resolveDeleteFailureReason(error.code, error.reasonCode),
        message: error.message,
        retryable: spec.retryable,
        hint: error.hint,
      };
    }
  }

  const spec = deleteFailureCatalog["transient-io"];
  return {
    code: "TRANSIENT_IO",
    reason: "target:temporary-failure",
    message: error instanceof Error ? error.message : "Unknown delete-document error",
    retryable: spec.retryable,
    hint: spec.hint,
  };
};
