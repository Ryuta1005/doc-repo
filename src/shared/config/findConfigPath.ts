import path from "node:path";
import fs from "fs-extra";

/**
 * cwd から上位ディレクトリへ doc-repo.config.json を探索し、
 * 最初に見つかったパスを返す。見つからない場合は undefined。
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
