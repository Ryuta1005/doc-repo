import path from "node:path";

// マルチページ静的サイトのリンク計算ヘルパー。
// 出力は `.doc-repo/<id>.html` のミラー構造になり、ページ間リンクはブラウザネイティブの相対パスで解決する。

const toPosix = (value: string): string => value.split(path.sep).join(path.posix.sep);

// 各セグメントを URL エンコードしつつ、`/`・`.`・`..` は保つ。
// 日本語やスペースを含む ID/パスでも file:// で確実に解決できるようにする。
const encodePath = (value: string): string =>
  value
    .split("/")
    .map((segment) => (segment === "" || segment === "." || segment === ".." ? segment : encodeURIComponent(segment)))
    .join("/");

// ページの出力ディレクトリの深さ（セグメント数）。ルート直下のページは 0。
export const pageDirDepth = (relativePath: string): number => {
  const dir = path.posix.dirname(toPosix(relativePath));
  return dir === "." || dir === "" ? 0 : dir.split("/").length;
};

// ページ出力ディレクトリから `.doc-repo` ルートへ戻る相対プレフィックス（styles.css 等のサイト内資産向け）。
export const siteRootPrefix = (relativePath: string): string => "../".repeat(pageDirDepth(relativePath));

// ページ出力ディレクトリからリポジトリルートへ戻る相対プレフィックス（`.doc-repo` を抜ける画像・添付向け）。
export const repoRootPrefix = (relativePath: string): string => "../".repeat(pageDirDepth(relativePath) + 1);

// 現在ページから対象ページ ID（拡張子なし）への相対 `.html` リンク。
export const docHref = (currentRelativePath: string, targetId: string): string => {
  const currentDir = path.posix.dirname(toPosix(currentRelativePath));
  const baseDir = currentDir === "." ? "" : currentDir;
  const relative = path.posix.relative(baseDir, toPosix(targetId));
  return `${encodePath(relative)}.html`;
};

// リポジトリ相対の資産パス（画像・添付など）を、現在ページからの相対パスへ変換する。
export const assetHref = (currentRelativePath: string, pathFromRoot: string, suffix: string): string =>
  `${repoRootPrefix(currentRelativePath)}${encodePath(pathFromRoot)}${suffix}`;

// T004: 生成画像 URL ヘルパー
// `.doc-repo/assets/<リポジトリ相対パス>` にコピーされた参照画像を指す相対 URL を返す。
// 例: currentRelativePath="docs/guide/page.md", repoRelativeImagePath="docs/assets/screenshot.png"
//     → "../../assets/docs/assets/screenshot.png"
export const generatedAssetHref = (currentRelativePath: string, repoRelativeImagePath: string): string =>
  `${siteRootPrefix(currentRelativePath)}assets/${encodePath(repoRelativeImagePath)}`;
