import path from "node:path";
import fs from "fs-extra";

import { toUserGuidance } from "../../shared/errors.js";
import type { InitResult } from "../../shared/types.js";

const DEFAULT_CONFIG = {
  name: "Doc Repo",
  rootDir: ".",
  include: ["**/*.md"],
  exclude: [],
  port: 4000,
} as const;

export const createConfigFile = async (cwd: string): Promise<InitResult> => {
  const configPath = path.resolve(cwd, "doc-repo.config.json");

  try {
    const exists = await fs.pathExists(configPath);
    if (exists) {
      return {
        status: "already-exists",
        configPath,
      };
    }

    await fs.writeJson(configPath, DEFAULT_CONFIG, { spaces: 2 });

    return {
      status: "created",
      configPath,
    };
  } catch (error) {
    const guidance = toUserGuidance(error);

    return {
      status: "failure",
      configPath,
      errorReason: guidance.reason,
    };
  }
};
