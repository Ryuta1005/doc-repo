import path from "node:path";

// Viewer HTML 内で使うリポジトリ相対リンクの計算ヘルパー。

const toPosix = (value: string): string => value.split(path.sep).join(path.posix.sep);

// 各セグメントを URL エンコードしつつ、`/`・`.`・`..` は保つ。
// 日本語やスペースを含む ID/パスでも HTTP 経由で安定して解決できるようにする。
const encodePath = (value: string): string =>
  value
    .split("/")
    .map((segment) => (segment === "" || segment === "." || segment === ".." ? segment : encodeURIComponent(segment)))
    .join("/");

// 現在文書のディレクトリ深さ（セグメント数）。ルート直下の文書は 0。
export const pageDirDepth = (relativePath: string): number => {
  const dir = path.posix.dirname(toPosix(relativePath));
  return dir === "." || dir === "" ? 0 : dir.split("/").length;
};

// 現在文書から Viewer ルートへ戻る相対プレフィックス。
export const siteRootPrefix = (relativePath: string): string => "../".repeat(pageDirDepth(relativePath));

// 現在文書からリポジトリルートへ戻る相対プレフィックス（添付などのリポジトリ資産向け）。
export const repoRootPrefix = (relativePath: string): string => "../".repeat(pageDirDepth(relativePath) + 1);

// 現在文書から対象文書 ID（拡張子なし）への Viewer 内リンク。
export const docHref = (currentRelativePath: string, targetId: string): string => {
  const currentDir = path.posix.dirname(toPosix(currentRelativePath));
  const baseDir = currentDir === "." ? "" : currentDir;
  const relative = path.posix.relative(baseDir, toPosix(targetId));
  return `${encodePath(relative)}.html`;
};

// リポジトリ相対の資産パス（添付など）を、現在文書からの相対パスへ変換する。
export const assetHref = (currentRelativePath: string, pathFromRoot: string, suffix: string): string =>
  `${repoRootPrefix(currentRelativePath)}${encodePath(pathFromRoot)}${suffix}`;

// Viewer の `/assets/<リポジトリ相対パス>` 配信に向けた画像 URL を返す。
// 例: currentRelativePath="docs/guide/page.md", repoRelativeImagePath="docs/assets/screenshot.png"
//     → "../../assets/docs/assets/screenshot.png"
export const viewerAssetHref = (currentRelativePath: string, repoRelativeImagePath: string): string =>
  `${siteRootPrefix(currentRelativePath)}assets/${encodePath(repoRelativeImagePath)}`;
