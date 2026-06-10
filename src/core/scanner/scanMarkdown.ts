import path from "node:path";
import fg from "fast-glob";

import type { MarkdownFile } from "../../shared/types.js";

const DEFAULT_IGNORE = ["node_modules/**", ".git/**", ".doc-repo/**"];

interface ScanMarkdownOptions {
  includePatterns?: string[];
  excludePatterns?: string[];
}

export const scanMarkdown = async (
  rootDir: string,
  scanDir: string = rootDir,
  options: ScanMarkdownOptions = {},
): Promise<MarkdownFile[]> => {
  const relativePrefix = path.relative(rootDir, scanDir);

  const includeGlobs =
    options.includePatterns && options.includePatterns.length > 0 ? options.includePatterns : ["**/*.md"];

  const ignore = [...DEFAULT_IGNORE, ...(options.excludePatterns ?? [])];

  const matches = await fg(includeGlobs, {
    cwd: scanDir,
    onlyFiles: true,
    dot: false,
    ignore,
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
