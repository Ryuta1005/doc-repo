import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it } from "vitest";

import { generateSite } from "../src/core/site/generateSite.js";

const tempDirs: string[] = [];

const makeTempDir = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "doc-repo-viewer-e2e-"));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
});

describe("multi-page static output E2E", () => {
  it("左ツリーと本文エリアに必要要素が描画されること。", async () => {
    const fixtureRoot = await makeTempDir();
    await fs.outputFile(path.join(fixtureRoot, "README.md"), "# Top\n\ntop body");
    await fs.outputFile(path.join(fixtureRoot, "docs", "first.md"), "# First\n\nfirst body");

    const result = await generateSite({ cwd: fixtureRoot });
    expect(result.status).toBe("success");

    const outDir = path.join(fixtureRoot, ".doc-repo");
    const html = await fs.readFile(path.join(outDir, "docs", "first.html"), "utf8");

    const dom = new JSDOM(html);
    try {
      const tree = dom.window.document.getElementById("tree");
      const article = dom.window.document.getElementById("article");

      expect(tree).not.toBeNull();
      expect(article).not.toBeNull();
      expect(tree?.textContent).toContain("README.md");
      expect(article?.textContent).toContain("first body");
    } finally {
      dom.window.close();
    }
  });

  it("各 Markdown がミラー構造の実 HTML として出力され、ルート index.html が生成されること。", async () => {
    const fixtureRoot = await makeTempDir();
    await fs.outputFile(path.join(fixtureRoot, "README.md"), "# Top\n\ntop body");
    await fs.outputFile(path.join(fixtureRoot, "docs", "first.md"), "# First\n\nfirst body");
    await fs.outputFile(path.join(fixtureRoot, "docs", "second.md"), "# Second\n\nsecond body");

    const result = await generateSite({ cwd: fixtureRoot });
    expect(result.status).toBe("success");

    const outDir = path.join(fixtureRoot, ".doc-repo");
    expect(await fs.pathExists(path.join(outDir, "index.html"))).toBe(true);
    expect(await fs.pathExists(path.join(outDir, "README.html"))).toBe(true);
    expect(await fs.pathExists(path.join(outDir, "docs", "first.html"))).toBe(true);
    expect(await fs.pathExists(path.join(outDir, "docs", "second.html"))).toBe(true);
    expect(await fs.pathExists(path.join(outDir, "styles.css"))).toBe(true);
    expect(await fs.pathExists(path.join(outDir, "app.js"))).toBe(true);
    expect(await fs.pathExists(path.join(outDir, "content.json"))).toBe(false);

    const firstHtml = await fs.readFile(path.join(outDir, "docs", "first.html"), "utf8");
    expect(firstHtml).toContain('src="../app.js"');
  });

  it("本文内の Markdown リンクが、実在する相対 .html へ解決され、その先のファイルが存在すること。", async () => {
    const fixtureRoot = await makeTempDir();
    await fs.outputFile(path.join(fixtureRoot, "docs", "first.md"), "# First\n\n[Go second](./second.md)");
    await fs.outputFile(path.join(fixtureRoot, "docs", "second.md"), "# Second\n\nsecond body");

    const result = await generateSite({ cwd: fixtureRoot });
    expect(result.status).toBe("success");

    const outDir = path.join(fixtureRoot, ".doc-repo");
    const firstHtmlPath = path.join(outDir, "docs", "first.html");
    const html = await fs.readFile(firstHtmlPath, "utf8");

    const dom = new JSDOM(html);
    try {
      const article = dom.window.document.getElementById("article");
      const link = article?.querySelector("a[href]");
      const href = link?.getAttribute("href");
      expect(href).toBe("second.html");

      const targetPath = path.resolve(path.dirname(firstHtmlPath), href ?? "");
      expect(await fs.pathExists(targetPath)).toBe(true);
    } finally {
      dom.window.close();
    }
  });

  it("ネストしたページのサイドバーから別ページへ相対 .html リンクで辿れること。", async () => {
    const fixtureRoot = await makeTempDir();
    await fs.outputFile(path.join(fixtureRoot, "README.md"), "# Top\n\ntop");
    await fs.outputFile(path.join(fixtureRoot, "docs", "guide", "page.md"), "# Guide\n\nguide");

    const result = await generateSite({ cwd: fixtureRoot });
    expect(result.status).toBe("success");

    const outDir = path.join(fixtureRoot, ".doc-repo");
    const nestedHtmlPath = path.join(outDir, "docs", "guide", "page.html");
    const html = await fs.readFile(nestedHtmlPath, "utf8");

    const dom = new JSDOM(html);
    try {
      const treeLink = [...dom.window.document.querySelectorAll<HTMLAnchorElement>("#tree a")].find(
        (anchor) => anchor.textContent === "README.md",
      );
      const href = treeLink?.getAttribute("href");
      expect(href).toBe("../../README.html");

      const targetPath = path.resolve(path.dirname(nestedHtmlPath), href ?? "");
      expect(await fs.pathExists(targetPath)).toBe(true);
    } finally {
      dom.window.close();
    }
  });

});
