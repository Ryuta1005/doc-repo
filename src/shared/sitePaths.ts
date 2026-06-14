import path from "node:path";

// Helpers for repository-relative links used in Viewer HTML.

const toPosix = (value: string): string => value.split(path.sep).join(path.posix.sep);

// URL-encode each segment while preserving `/`, `.`, and `..`.
// This keeps IDs and paths with spaces or non-ASCII text stable over HTTP.
const encodePath = (value: string): string =>
  value
    .split("/")
    .map((segment) => (segment === "" || segment === "." || segment === ".." ? segment : encodeURIComponent(segment)))
    .join("/");

// Directory depth of the current document. Root-level documents have depth 0.
export const pageDirDepth = (relativePath: string): number => {
  const dir = path.posix.dirname(toPosix(relativePath));
  return dir === "." || dir === "" ? 0 : dir.split("/").length;
};

// Relative prefix from the current document back to the Viewer root.
export const siteRootPrefix = (relativePath: string): string => "../".repeat(pageDirDepth(relativePath));

// Relative prefix from the current document back to the repository root for repository assets.
export const repoRootPrefix = (relativePath: string): string => "../".repeat(pageDirDepth(relativePath) + 1);

// Viewer link from the current document to a target document ID without extension.
export const docHref = (currentRelativePath: string, targetId: string): string => {
  const currentDir = path.posix.dirname(toPosix(currentRelativePath));
  const baseDir = currentDir === "." ? "" : currentDir;
  const relative = path.posix.relative(baseDir, toPosix(targetId));
  return `${encodePath(relative)}.html`;
};

// Convert a repository-relative asset path to a relative path from the current document.
export const assetHref = (currentRelativePath: string, pathFromRoot: string, suffix: string): string =>
  `${repoRootPrefix(currentRelativePath)}${encodePath(pathFromRoot)}${suffix}`;

// Return an image URL for the Viewer's `/assets/<repository-relative-path>` serving contract.
// Example: currentRelativePath="docs/guide/page.md", repoRelativeImagePath="docs/assets/screenshot.png"
//     → "../../assets/docs/assets/screenshot.png"
export const viewerAssetHref = (currentRelativePath: string, repoRelativeImagePath: string): string =>
  `${siteRootPrefix(currentRelativePath)}assets/${encodePath(repoRelativeImagePath)}`;
