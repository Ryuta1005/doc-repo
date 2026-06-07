import type { GenerationResult } from "../shared/types.js";

export const resolveExitCode = (result: GenerationResult): number => {
  return result.exitCode;
};
