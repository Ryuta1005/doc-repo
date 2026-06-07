import type { GenerationResult } from "../shared/types.js";

export const formatResultMessage = (result: GenerationResult): string => {
  const lines = [result.message, `生成対象: ${result.targetPath}`, `出力先: ${result.outputDir}`];

  if (result.warnings.length > 0) {
    lines.push("警告:");
    for (const warning of result.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  if (result.status === "failure") {
    if (result.errorReason) {
      lines.push(`理由: ${result.errorReason}`);
    }
    if (result.hint) {
      lines.push(`対処: ${result.hint}`);
    }
  }

  return lines.join("\n");
};
