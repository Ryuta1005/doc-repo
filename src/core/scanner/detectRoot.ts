import path from "node:path";
import fs from "fs-extra";

import type { RootDetectionResult } from "../../shared/types.js";

export const detectRoot = async (cwd: string): Promise<RootDetectionResult> => {
  let current = path.resolve(cwd);

  while (true) {
    const gitPath = path.join(current, ".git");
    if (await fs.pathExists(gitPath)) {
      return {
        detectedRoot: current,
        usedFallback: false,
      };
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return {
        detectedRoot: path.resolve(cwd),
        usedFallback: true,
      };
    }

    current = parent;
  }
};
