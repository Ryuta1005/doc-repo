import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

import { scanMarkdown } from "./scanMarkdown.js";

const tempDirs: string[] = [];

const makeTempDir = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "doc-repo-scan-md-"));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
});

describe("scanMarkdown.ts", () => {
  it("Markdown を走査した場合、ソート済みの relativePath/absolutePath が返却されること。", async () => {
    const root = await makeTempDir();
    await fs.outputFile(path.join(root, "b.md"), "# b");
    await fs.outputFile(path.join(root, "a.md"), "# a");

    const result = await scanMarkdown(root);

    expect(result.map((x) => x.relativePath)).toEqual(["a.md", "b.md"]);
    expect(result[0]?.absolutePath).toBe(path.join(root, "a.md"));
  });

  it("ignore 対象ディレクトリ配下の Markdown は返却されないこと。", async () => {
    const root = await makeTempDir();
    await fs.outputFile(path.join(root, "docs", "ok.md"), "# ok");
    await fs.outputFile(path.join(root, "node_modules", "skip.md"), "# skip");
    await fs.outputFile(path.join(root, ".git", "skip.md"), "# skip");
    await fs.outputFile(path.join(root, ".doc-repo", "skip.md"), "# skip");
    await fs.outputFile(path.join(root, "dist", "skip.md"), "# skip");

    const result = await scanMarkdown(root);

    expect(result.map((x) => x.relativePath)).toEqual(["docs/ok.md"]);
  });

  it("scanDir を指定した場合、rootDir からの相対パスで返却されること。", async () => {
    const root = await makeTempDir();
    const scanDir = path.join(root, "docs");
    await fs.outputFile(path.join(scanDir, "guide", "intro.md"), "# intro");

    const result = await scanMarkdown(root, scanDir);

    expect(result).toHaveLength(1);
    expect(result[0]?.relativePath).toBe("docs/guide/intro.md");
    expect(result[0]?.absolutePath).toBe(path.join(root, "docs/guide/intro.md"));
  });

  it("includePatterns を指定した場合、一致するファイルのみ返却されること。", async () => {
    const root = await makeTempDir();
    await fs.outputFile(path.join(root, "docs", "guide.md"), "# guide");
    await fs.outputFile(path.join(root, "drafts", "wip.md"), "# wip");
    await fs.outputFile(path.join(root, "README.md"), "# root");

    const result = await scanMarkdown(root, root, { includePatterns: ["docs/**"] });

    expect(result.map((x) => x.relativePath)).toEqual(["docs/guide.md"]);
  });

  it("includePatterns が空配列の場合、**/*.md と同じ動作になること。", async () => {
    const root = await makeTempDir();
    await fs.outputFile(path.join(root, "a.md"), "# a");
    await fs.outputFile(path.join(root, "docs", "b.md"), "# b");

    const result = await scanMarkdown(root, root, { includePatterns: [] });

    expect(result.map((x) => x.relativePath)).toEqual(["a.md", "docs/b.md"]);
  });

  it("excludePatterns を指定した場合、一致するファイルが除外されること。", async () => {
    const root = await makeTempDir();
    await fs.outputFile(path.join(root, "docs", "ok.md"), "# ok");
    await fs.outputFile(path.join(root, "drafts", "skip.md"), "# skip");

    const result = await scanMarkdown(root, root, { excludePatterns: ["drafts/**"] });

    expect(result.map((x) => x.relativePath)).toEqual(["docs/ok.md"]);
  });

  it("exclude は include より優先されること。", async () => {
    const root = await makeTempDir();
    await fs.outputFile(path.join(root, "docs", "ok.md"), "# ok");
    await fs.outputFile(path.join(root, "docs", "private", "secret.md"), "# secret");

    const result = await scanMarkdown(root, root, {
      includePatterns: ["docs/**"],
      excludePatterns: ["docs/private/**"],
    });

    expect(result.map((x) => x.relativePath)).toEqual(["docs/ok.md"]);
  });
});
