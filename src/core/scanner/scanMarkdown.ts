import path from "node:path";
import fg from "fast-glob";

import type { MarkdownFile } from "../../shared/types.js";

export const scanMarkdown = async (rootDir: string, scanDir: string = rootDir): Promise<MarkdownFile[]> => {
  const relativePrefix = path.relative(rootDir, scanDir);
  const matches = await fg("**/*.md", {
    cwd: scanDir,
    onlyFiles: true,
    dot: false,
    ignore: ["node_modules/**", ".git/**", ".doc-repo/**", "dist/**"],
  });

  return matches
    .sort((a, b) => a.localeCompare(b))
    .map((matchedPath) => {
      const relativePath = relativePrefix
        ? path.posix.join(relativePrefix.split(path.sep).join(path.posix.sep), matchedPath)
        : matchedPath;

      return {
        relativePath,
        absolutePath: path.join(rootDir, relativePath),
      };
    });
};
