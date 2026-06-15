import path from "node:path";
import micromatch from "micromatch";

interface WatchTargetFilterInput {
  rootDir: string;
  includePatterns?: string[];
  excludePatterns?: string[];
}

const DEFAULT_EXCLUDE_SEGMENTS = new Set([".doc-repo", ".git", "node_modules"]);

const toPosixPath = (p: string): string => p.split(path.sep).join(path.posix.sep);

export const createWatchTargetFilter = (input: WatchTargetFilterInput) => {
  const rootDir = path.resolve(input.rootDir);
  const includes = (input.includePatterns ?? []).map((p) => toPosixPath(p.replace(/^\.\//, "")));
  const excludes = (input.excludePatterns ?? []).map((p) => toPosixPath(p.replace(/^\.\//, "")));

  return {
    isIgnoredWatchPath: (absolutePath: string, isFile: boolean): boolean => {
      const resolved = path.resolve(absolutePath);
      const relative = path.relative(rootDir, resolved);

      if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
        return false;
      }

      const relPosix = toPosixPath(relative);
      const segments = relPosix.split("/");
      if (segments.some((s) => DEFAULT_EXCLUDE_SEGMENTS.has(s))) {
        return true;
      }

      if (excludes.length > 0 && micromatch.isMatch(relPosix, excludes)) {
        return true;
      }

      if (!isFile) {
        return false;
      }

      return !relPosix.endsWith(".md") || (includes.length > 0 && !micromatch.isMatch(relPosix, includes));
    },
    isTargetPath: (absolutePath: string): boolean => {
      const resolved = path.resolve(absolutePath);
      const relative = path.relative(rootDir, resolved);

      if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
        return false;
      }

      const relPosix = toPosixPath(relative);
      const segments = relPosix.split("/");
      if (segments.some((s) => DEFAULT_EXCLUDE_SEGMENTS.has(s))) {
        return false;
      }

      if (!relPosix.endsWith(".md")) {
        return false;
      }

      if (includes.length > 0 && !micromatch.isMatch(relPosix, includes)) {
        return false;
      }

      if (excludes.length > 0 && micromatch.isMatch(relPosix, excludes)) {
        return false;
      }

      return true;
    },
  };
};
