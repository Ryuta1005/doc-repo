export class AppError extends Error {
  public readonly code: string;
  public readonly hint: string;

  public constructor(message: string, code: string, hint: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.hint = hint;
  }
}

export type ServeFailureCode = "invalid-port" | "port-conflict" | "unknown";

export type SaveFailureCode = "invalid-target" | "unwritable-target" | "transient-io";

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
