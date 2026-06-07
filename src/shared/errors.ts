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
