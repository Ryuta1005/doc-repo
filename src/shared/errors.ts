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

export type ServeFailureCode =
  | "invalid-port"
  | "port-conflict"
  | "initial-generate-failed"
  | "missing-output"
  | "unknown";

const serveFailureCatalog: Record<ServeFailureCode, { code: string; hint: string }> = {
  "invalid-port": {
    code: "INVALID_PORT",
    hint: "port は 1 から 65535 の整数で指定してください。",
  },
  "port-conflict": {
    code: "PORT_CONFLICT",
    hint: "別のポートを指定するか、使用中のプロセスを停止してください。",
  },
  "initial-generate-failed": {
    code: "INITIAL_GENERATE_FAILED",
    hint: "生成エラーの原因を確認し、入力ファイルや設定を修正してください。",
  },
  "missing-output": {
    code: "MISSING_OUTPUT",
    hint: "出力先 .doc-repo が存在するか確認し、必要なら再生成してください。",
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

    if (error.code === "INITIAL_GENERATE_FAILED") {
      return {
        type: "initial-generate-failed",
        reason: `${error.code}: ${error.message}`,
        hint: error.hint,
      };
    }

    if (error.code === "MISSING_OUTPUT") {
      return {
        type: "missing-output",
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
