import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

import { renderPages } from "./renderPages.js";

const tempDirs: string[] = [];

const makeTempDir = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "doc-repo-render-pages-"));
  tempDirs.push(dir);
  return dir;
};

const PAGE_TEMPLATE = [
  "<!doctype html>",
  "<title>__TITLE__</title>",
  '<link rel="stylesheet" href="__STYLES_HREF__" />',
  '<script src="__APP_JS_SRC__"></script>',
  '<a class="home" href="__HOME_HREF__">__SITE_NAME__</a>',
  '<nav id="tree">__SIDEBAR__</nav>',
  '<article id="article">__ARTICLE__</article>',
].join("\n");

const writeTemplate = async (templatesDir: string): Promise<void> => {
  await fs.outputFile(path.join(templatesDir, "page.html"), PAGE_TEMPLATE, "utf8");
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
});

describe("renderPages.ts", () => {
  it("各ページがミラー構造の実 HTML として出力されること。", async () => {
    const root = await makeTempDir();
    const templatesDir = path.join(root, "templates");
    const stagingDir = path.join(root, "staging");
    await writeTemplate(templatesDir);

    await renderPages(templatesDir, stagingDir, {
      pages: [
        { id: "README", title: "README", relativePath: "README.md", html: "<p>top</p>" },
        { id: "docs/guide/page", title: "Guide", relativePath: "docs/guide/page.md", html: "<p>guide</p>" },
      ],
      siteName: "Team Docs",
      referencedImages: [],
      viewerAssets: { styleFile: "styles.css", scriptFile: "app.js" },
      tree: [
        { type: "file", name: "README.md", id: "README" },
        {
          type: "dir",
          name: "docs",
          children: [
            {
              type: "dir",
              name: "guide",
              children: [{ type: "file", name: "page.md", id: "docs/guide/page" }],
            },
          ],
        },
      ],
    });

    expect(await fs.pathExists(path.join(stagingDir, "README.html"))).toBe(true);
    expect(await fs.pathExists(path.join(stagingDir, "docs", "guide", "page.html"))).toBe(true);

    // フォルダは details/summary でネイティブに開閉できる（JS 不要）。
    const nested = await fs.readFile(path.join(stagingDir, "docs", "guide", "page.html"), "utf8");
    expect(nested).toContain('class="home" href="../../index.html">Team Docs</a>');
    expect(nested).toContain("<details");
    expect(nested).toContain("<summary>docs</summary>");
  });

  it("サイドバーのフォルダは現在ページを含む階層だけ初期表示で開くこと。", async () => {
    const root = await makeTempDir();
    const templatesDir = path.join(root, "templates");
    const stagingDir = path.join(root, "staging");
    await writeTemplate(templatesDir);

    await renderPages(templatesDir, stagingDir, {
      pages: [
        { id: "docs/guide/page", title: "Guide", relativePath: "docs/guide/page.md", html: "<p>guide</p>" },
        { id: "api/reference", title: "API", relativePath: "api/reference.md", html: "<p>api</p>" },
      ],
      siteName: "Doc Repo",
      referencedImages: [],
      viewerAssets: { styleFile: "styles.css", scriptFile: "app.js" },
      tree: [
        {
          type: "dir",
          name: "api",
          children: [{ type: "file", name: "reference.md", id: "api/reference" }],
        },
        {
          type: "dir",
          name: "docs",
          children: [
            {
              type: "dir",
              name: "guide",
              children: [{ type: "file", name: "page.md", id: "docs/guide/page" }],
            },
          ],
        },
      ],
    });

    const html = await fs.readFile(path.join(stagingDir, "docs", "guide", "page.html"), "utf8");
    expect(html).toContain("<details><summary>api</summary>");
    expect(html).toContain("<details open><summary>docs</summary>");
    expect(html).toContain("<details open><summary>guide</summary>");
  });

  it("ネストしたページの styles/home/サイドバーリンクが深さに応じた相対パスになること。", async () => {
    const root = await makeTempDir();
    const templatesDir = path.join(root, "templates");
    const stagingDir = path.join(root, "staging");
    await writeTemplate(templatesDir);

    await renderPages(templatesDir, stagingDir, {
      pages: [
        { id: "README", title: "README", relativePath: "README.md", html: "<p>top</p>" },
        { id: "docs/guide/page", title: "Guide", relativePath: "docs/guide/page.md", html: "<p>guide</p>" },
      ],
      siteName: "Doc Repo",
      referencedImages: [],
      viewerAssets: { styleFile: "styles.css", scriptFile: "app.js" },
      tree: [
        { type: "file", name: "README.md", id: "README" },
        { type: "file", name: "page.md", id: "docs/guide/page" },
      ],
    });

    const nested = await fs.readFile(path.join(stagingDir, "docs", "guide", "page.html"), "utf8");
    expect(nested).toContain('href="../../styles.css"');
    expect(nested).toContain('src="../../app.js"');
    expect(nested).toContain('href="../../index.html"');
    // サイドバーから README へは相対 .html リンク。
    expect(nested).toContain('href="../../README.html"');
    // 自ページは selected。
    expect(nested).toContain('aria-current="page"');
  });

  it("ルート index.html は README へリダイレクトすること。", async () => {
    const root = await makeTempDir();
    const templatesDir = path.join(root, "templates");
    const stagingDir = path.join(root, "staging");
    await writeTemplate(templatesDir);

    await renderPages(templatesDir, stagingDir, {
      pages: [{ id: "README", title: "README", relativePath: "README.md", html: "<p>top</p>" }],
      siteName: "Doc Repo",
      referencedImages: [],
      viewerAssets: { styleFile: "styles.css", scriptFile: "app.js" },
      tree: [{ type: "file", name: "README.md", id: "README" }],
    });

    const index = await fs.readFile(path.join(stagingDir, "index.html"), "utf8");
    expect(index).toContain('http-equiv="refresh"');
    expect(index).toContain("./README.html");
  });

  it("ページが 0 件の場合、index.html に未検出メッセージが出力されること。", async () => {
    const root = await makeTempDir();
    const templatesDir = path.join(root, "templates");
    const stagingDir = path.join(root, "staging");
    await writeTemplate(templatesDir);

    await renderPages(templatesDir, stagingDir, {
      pages: [],
      siteName: "Doc Repo",
      referencedImages: [],
      viewerAssets: { styleFile: "styles.css", scriptFile: "app.js" },
      tree: [],
    });

    const index = await fs.readFile(path.join(stagingDir, "index.html"), "utf8");
    expect(index).toContain("No Markdown files found.");
  });
});
