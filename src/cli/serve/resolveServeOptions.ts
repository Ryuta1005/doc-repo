import { resolveRuntimeConfig } from "../../shared/config/resolveRuntimeConfig.js";
import type { ResolvedConfig } from "../../shared/types.js";

interface ResolveServeOptionsInput {
  cwd: string;
  cliPort?: number;
}

export const resolveServeOptions = async (input: ResolveServeOptionsInput): Promise<ResolvedConfig> => {
  return resolveRuntimeConfig({ cwd: input.cwd, cliPort: input.cliPort });
};
