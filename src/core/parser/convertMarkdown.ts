import path from "node:path";
import MarkdownIt from "markdown-it";

import { assetHref, docHref, viewerAssetHref } from "../../shared/sitePaths.js";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});

const EXTERNAL_OR_HASH = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

// markdown-it percent-encodes href internally, so decode before resolving.
// Keep invalid escapes unchanged as the safer fallback.
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

  return `${viewerAssetHref(relativePath, pathFromRoot)}${suffix}`;
};

// Resolve a normalized path from the repository root. Return null for empty paths or paths outside the root.
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
  referencedImages?: Set<string>;
}

// Resolve link targets against known page IDs and return only exact matches.
// Matching real pages instead of guessing keeps navigation behavior stable.
const resolveDocId = (href: string, relativePath: string, knownIds: Set<string>): string | null => {
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

    return null;
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

    // Collect referenced images for the copy contract independently from HTML src rewriting.
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
  const { relativePath, knownIds } = (env ?? {}) as RenderEnv;

  if (href && relativePath) {
    const docId = knownIds ? resolveDocId(href, relativePath, knownIds) : null;

    if (docId) {
      // Links that match real pages become relative .html links from the current page.
      tokens[idx]?.attrSet("href", docHref(relativePath, docId));
    } else {
      // Everything else, including images, attachments, external links, and unresolved links, is rebased as an asset path.
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
): { title: string; html: string; referencedImages: string[] } => {
  const title = findTitle(source, relativePath);
  const referencedImages = new Set<string>();
  const html = md.render(source, { relativePath, knownIds, referencedImages } satisfies RenderEnv);

  return { title, html, referencedImages: Array.from(referencedImages) };
};
