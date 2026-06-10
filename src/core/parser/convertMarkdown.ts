import path from "node:path";
import MarkdownIt from "markdown-it";

import { assetHref, docHref, generatedAssetHref } from "../../shared/sitePaths.js";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});

const EXTERNAL_OR_HASH = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

// markdown-it は href を内部でパーセントエンコードするため、解決前に生パスへ戻す。
// 不正なエスケープはデコードせず元の値を返す（安全側）。
const decodePathSafe = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const splitUrlAndSuffix = (url: string): { rawPath: string; suffix: string } => {
  const hashIndex = url.indexOf("#");
  const queryIndex = url.indexOf("?");
  const firstSuffixIndex =
    hashIndex === -1 ? queryIndex : queryIndex === -1 ? hashIndex : Math.min(hashIndex, queryIndex);

  if (firstSuffixIndex === -1) {
    return { rawPath: decodePathSafe(url), suffix: "" };
  }

  return {
    rawPath: decodePathSafe(url.slice(0, firstSuffixIndex)),
    suffix: url.slice(firstSuffixIndex),
  };
};

const rebaseRepoRelativeUrl = (url: string, relativePath: string): string => {
  if (!url || EXTERNAL_OR_HASH.test(url)) {
    return url;
  }

  const { rawPath, suffix } = splitUrlAndSuffix(url);
  const pathFromRoot = resolvePathFromRoot(rawPath, relativePath);
  if (!pathFromRoot) {
    return url;
  }

  return assetHref(relativePath, pathFromRoot, suffix);
};

const rebaseGeneratedImageUrl = (url: string, relativePath: string): string => {
  if (!url || EXTERNAL_OR_HASH.test(url)) {
    return url;
  }

  const { rawPath, suffix } = splitUrlAndSuffix(url);
  const pathFromRoot = resolvePathFromRoot(rawPath, relativePath);
  if (!pathFromRoot) {
    return url;
  }

  return `${generatedAssetHref(relativePath, pathFromRoot)}${suffix}`;
};

// リポジトリルートからの正規化パスを求める。ルート外（../ で抜ける）や空は null。
const resolvePathFromRoot = (rawPath: string, relativePath: string): string | null => {
  if (!rawPath) {
    return null;
  }

  const normalizedRelativePath = relativePath.split(path.sep).join(path.posix.sep);
  const pathFromRoot = rawPath.startsWith("/")
    ? rawPath.slice(1)
    : path.posix.normalize(path.posix.join(path.posix.dirname(normalizedRelativePath), rawPath));

  if (!pathFromRoot || pathFromRoot.startsWith("../")) {
    return null;
  }

  return pathFromRoot;
};

interface RenderEnv {
  relativePath?: string;
  knownIds?: Set<string>;
  uniqueBasenames?: Map<string, string>;
  referencedImages?: Set<string>;
}

// 既知のページID集合に対してリンク先を解決し、一致したIDだけを返す。
// 推測ではなく実在ページとの突き合わせで判定するため、遷移可否が安定する。
// 厳密解決に失敗した .md リンクは、同名ページが一意な場合のみベース名で救済する。
const resolveDocId = (
  href: string,
  relativePath: string,
  knownIds: Set<string>,
  uniqueBasenames: Map<string, string>,
): string | null => {
  if (!href || EXTERNAL_OR_HASH.test(href)) {
    return null;
  }

  const { rawPath } = splitUrlAndSuffix(href);
  const pathFromRoot = resolvePathFromRoot(rawPath, relativePath);

  if (/\.md$/i.test(rawPath)) {
    if (pathFromRoot) {
      const id = pathFromRoot.replace(/\.md$/i, "");
      if (knownIds.has(id)) {
        return id;
      }
    }

    // フォールバック: 相対パスがズレていても、同名ページが 1 件だけなら救済する。
    const basename = path.posix.basename(rawPath).replace(/\.md$/i, "");
    return uniqueBasenames.get(basename) ?? null;
  }

  if (!pathFromRoot) {
    return null;
  }

  const basename = path.posix.basename(rawPath);
  const isDirectoryLike = rawPath.endsWith("/") || !basename.includes(".");
  if (isDirectoryLike) {
    const indexId = path.posix.join(pathFromRoot, "index");
    if (knownIds.has(indexId)) {
      return indexId;
    }
  }

  return knownIds.has(pathFromRoot) ? pathFromRoot : null;
};

const imageRule = md.renderer.rules.image;
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const src = tokens[idx]?.attrGet("src");
  const { relativePath, referencedImages } = (env ?? {}) as RenderEnv;

  if (src && relativePath) {
    const newSrc = rebaseGeneratedImageUrl(src, relativePath);
    tokens[idx]?.attrSet("src", newSrc);

    // 画像コピー契約用に、HTML の src 変換とは独立して参照画像を収集する。
    if (!EXTERNAL_OR_HASH.test(src)) {
      const { rawPath } = splitUrlAndSuffix(src);
      const pathFromRoot = resolvePathFromRoot(rawPath, relativePath);
      if (pathFromRoot && referencedImages) {
        referencedImages.add(pathFromRoot);
      }
    }
  }

  return imageRule ? imageRule(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options);
};

const linkOpenRule = md.renderer.rules.link_open;
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const href = tokens[idx]?.attrGet("href");
  const { relativePath, knownIds, uniqueBasenames } = (env ?? {}) as RenderEnv;

  if (href && relativePath) {
    const docId = knownIds ? resolveDocId(href, relativePath, knownIds, uniqueBasenames ?? new Map()) : null;

    if (docId) {
      // 実在ページに一致したリンクは、現在ページからの相対 .html リンクへ。
      tokens[idx]?.attrSet("href", docHref(relativePath, docId));
    } else {
      // それ以外（画像/添付/外部/未解決）は資産として相対パスへリベースする。
      tokens[idx]?.attrSet("href", rebaseRepoRelativeUrl(href, relativePath));
    }
  }

  return linkOpenRule ? linkOpenRule(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options);
};

const findTitle = (source: string, relativePath: string): string => {
  const heading = source.match(/^#\s+(.+)$/m);
  if (heading?.[1]) {
    return heading[1].trim();
  }

  return path.basename(relativePath, ".md");
};

export const convertMarkdown = (
  source: string,
  relativePath: string,
  knownIds: Set<string> = new Set<string>(),
  uniqueBasenames: Map<string, string> = new Map<string, string>(),
): { title: string; html: string; referencedImages: string[] } => {
  const title = findTitle(source, relativePath);
  const referencedImages = new Set<string>();
  const html = md.render(source, { relativePath, knownIds, uniqueBasenames, referencedImages } satisfies RenderEnv);

  return { title, html, referencedImages: Array.from(referencedImages) };
};
