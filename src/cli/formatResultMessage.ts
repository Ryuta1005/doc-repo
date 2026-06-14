import type { ServeSession } from "../shared/types.js";

const formatServeMessage = (result: ServeSession): string => {
  const lines: string[] = [];

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
        lines.push(`Hint: ${failure.hint}`);
      }
    }
  }

  return lines.join("\n");
};

export const formatResultMessage = (result: ServeSession): string => {
  return formatServeMessage(result);
};
