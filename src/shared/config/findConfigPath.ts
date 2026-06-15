import path from "node:path";
import fs from "fs-extra";

/**
 * Search upward from cwd for doc-repo.config.json.
 * Return the first matching path, or undefined when none is found.
 */
export const findConfigPath = async (startDir: string): Promise<string | undefined> => {
  let current = path.resolve(startDir);

  while (true) {
    const configPath = path.join(current, "doc-repo.config.json");
    if (await fs.pathExists(configPath)) {
      return configPath;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return undefined;
    }

    current = parent;
  }
};
