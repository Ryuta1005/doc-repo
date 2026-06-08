import path from "node:path";
import fs from "fs-extra";

const ASSET_FILES = ["styles.css", "app.js"];

export const copyAssets = async (templatesDir: string, stagingDir: string): Promise<void> => {
  for (const file of ASSET_FILES) {
    await fs.copyFile(path.join(templatesDir, file), path.join(stagingDir, file));
  }
};
