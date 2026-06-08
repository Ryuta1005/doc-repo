import path from "node:path";

interface WatchTargetFilterInput {
  rootDir: string;
  includePatterns?: string[];
  excludePatterns?: string[];
}

const DEFAULT_EXCLUDE_SEGMENTS = new Set([".doc-repo", ".git", "node_modules"]);

const toPosixPath = (p: string): string => p.split(path.sep).join(path.posix.sep);

const matchesAnyPrefix = (value: string, patterns: string[]): boolean =>
  patterns.some((pattern) => value.startsWith(pattern));

export const createWatchTargetFilter = (input: WatchTargetFilterInput) => {
  const rootDir = path.resolve(input.rootDir);
  const includes = (input.includePatterns ?? []).map((p) => toPosixPath(p.replace(/^\.\//, "")));
  const excludes = (input.excludePatterns ?? []).map((p) => toPosixPath(p.replace(/^\.\//, "")));

  return {
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

      if (includes.length > 0 && !matchesAnyPrefix(relPosix, includes)) {
        return false;
      }

      if (matchesAnyPrefix(relPosix, excludes)) {
        return false;
      }

      return true;
    },
  };
};
