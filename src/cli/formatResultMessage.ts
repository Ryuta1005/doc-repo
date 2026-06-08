import type { GenerationResult, ServeSession } from "../shared/types.js";

const formatGenerationMessage = (result: GenerationResult): string => {
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

const formatServeMessage = (result: ServeSession): string => {
  const lines: string[] = [];

  const generationStep = result.steps.find((x) => x.step === "initial-generate");
  if (generationStep?.status === "success") {
    lines.push("[doc-repo] generate: success");
  }

  if (result.publicUrl) {
    lines.push(`[doc-repo] serve: listening on ${result.publicUrl}`);
  }

  if (result.status === "watching") {
    lines.push("[doc-repo] watch: started");
    lines.push("[doc-repo] watch: auto-reload enabled (SSE)");
    lines.push("[doc-repo] watch: press Ctrl+C to stop");
  }

  if (result.status === "failed") {
    const failure = result.failures[0];
    if (failure) {
      lines.push(`[doc-repo] error: ${failure.message}`);
      if (failure.hint) {
        lines.push(`対処: ${failure.hint}`);
      }
    }
  }

  return lines.join("\n");
};

export const formatResultMessage = (result: GenerationResult | ServeSession): string => {
  if ("targetPath" in result) {
    return formatGenerationMessage(result);
  }

  return formatServeMessage(result);
};
