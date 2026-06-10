import path from "node:path";
import fs from "fs-extra";

import { docHref, siteRootPrefix } from "../../shared/sitePaths.js";
import type { SiteBundle, SitePage, TreeNode } from "../../shared/types.js";

const TEMPLATE_FILE = "page.html";

const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// テンプレートのプレースホルダ置換。$ 連鎖を解釈させないため split/join を使う。
const fill = (template: string, key: string, value: string): string => template.split(key).join(value);

// サイドバーのツリーを、現在ページからの相対 .html リンクとして静的 HTML にレンダリングする。
// フォルダは <details>/<summary> でネイティブに開閉でき、JS は不要。
const renderTree = (nodes: TreeNode[], currentRelativePath: string, currentId: string): string => {
  const renderNodes = (items: TreeNode[]): string => {
    const lis = items
      .map((item) => {
        if (item.type === "dir") {
          return `<li><details open><summary>${escapeHtml(item.name)}</summary>${renderNodes(
            item.children,
          )}</details></li>`;
        }

        const href = docHref(currentRelativePath, item.id);
        const selected = item.id === currentId ? ' class="selected" aria-current="page"' : "";
        return `<li><a href="${href}"${selected}>${escapeHtml(item.name)}</a></li>`;
      })
      .join("");

    return `<ul>${lis}</ul>`;
  };

  return renderNodes(nodes);
};

const renderPageHtml = (template: string, page: SitePage, tree: TreeNode[]): string => {
  const stylesHref = `${siteRootPrefix(page.relativePath)}styles.css`;
  const appJsSrc = `${siteRootPrefix(page.relativePath)}app.js`;
  const homeHref = `${siteRootPrefix(page.relativePath)}index.html`;
  const sidebar = renderTree(tree, page.relativePath, page.id);

  let html = fill(template, "__TITLE__", escapeHtml(page.title));
  html = fill(html, "__STYLES_HREF__", stylesHref);
  html = fill(html, "__APP_JS_SRC__", appJsSrc);
  html = fill(html, "__HOME_HREF__", homeHref);
  html = fill(html, "__SIDEBAR__", sidebar);
  html = fill(html, "__ARTICLE__", page.html);
  return html;
};

// ルート index.html: ホームページ（README 優先、なければ先頭ページ）へリダイレクトする静的 HTML。
const pickHomePage = (pages: SitePage[]): SitePage | undefined =>
  pages.find((page) => page.id === "README" || page.id === "readme") ?? pages[0];

const renderIndexHtml = (bundle: SiteBundle): string => {
  const home = pickHomePage(bundle.pages);

  if (!home) {
    return [
      "<!doctype html>",
      '<html lang="ja">',
      "<head>",
      '<meta charset="utf-8" />',
      "<title>doc-repo</title>",
      '<link rel="stylesheet" href="./styles.css" />',
      "</head>",
      "<body>",
      '<main class="content"><article><p class="muted">No Markdown files found.</p></article></main>',
      "</body>",
      "</html>",
      "",
    ].join("\n");
  }

  const homeHref = `./${docHref("index.md", home.id)}`;

  return [
    "<!doctype html>",
    '<html lang="ja">',
    "<head>",
    '<meta charset="utf-8" />',
    `<meta http-equiv="refresh" content="0; url=${homeHref}" />`,
    `<link rel="canonical" href="${homeHref}" />`,
    "<title>doc-repo</title>",
    "</head>",
    "<body>",
    `<p>移動中です… <a href="${homeHref}">${escapeHtml(home.title)}</a></p>`,
    "</body>",
    "</html>",
    "",
  ].join("\n");
};

// 各 Markdown を 1 対 1 で実 HTML に出力し、ルート index.html も生成する。
export const renderPages = async (templatesDir: string, stagingDir: string, bundle: SiteBundle): Promise<void> => {
  const template = await fs.readFile(path.join(templatesDir, TEMPLATE_FILE), "utf8");

  for (const page of bundle.pages) {
    const outputPath = path.join(stagingDir, ...page.id.split("/")) + ".html";
    await fs.outputFile(outputPath, renderPageHtml(template, page, bundle.tree), "utf8");
  }

  await fs.outputFile(path.join(stagingDir, "index.html"), renderIndexHtml(bundle), "utf8");
};
