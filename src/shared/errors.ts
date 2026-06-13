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
    hint: "port は 1 から 65535 の整数で指定してください。",
  },
  "port-conflict": {
    code: "PORT_CONFLICT",
    hint: "別のポートを指定するか、使用中のプロセスを停止してください。",
  },
  unknown: {
    code: "UNKNOWN",
    hint: "詳細ログを確認して再実行してください。",
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
      hint: "実行ディレクトリの権限と入力ファイルを確認して再実行してください。",
    };
  }

  return {
    reason: "Unknown error",
    hint: "詳細ログを確認し、問題が解消しない場合は再実行してください。",
  };
};

const saveFailureCatalog: Record<SaveFailureCode, { code: string; hint: string; retryable: boolean }> = {
  "invalid-target": {
    code: "SAVE_TARGET_INVALID",
    hint: "保存先が rootDir 配下の .md で、include/exclude 条件とパス形式を満たしているか確認してください。",
    retryable: false,
  },
  "unwritable-target": {
    code: "SAVE_TARGET_UNWRITABLE",
    hint: "対象文書の存在と書き込み権限を確認してください。",
    retryable: false,
  },
  "transient-io": {
    code: "SAVE_IO_TEMPORARY",
    hint: "一時的な I/O 失敗の可能性があります。再試行してください。",
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
