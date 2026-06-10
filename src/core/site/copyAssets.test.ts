import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

import { copyAssets } from "./copyAssets.js";

const tempDirs: string[] = [];

const makeTempDir = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "doc-repo-copy-assets-"));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
});

describe("copyAssets.ts", () => {
  it("templates 配下の assets を staging にコピーできること。", async () => {
    const root = await makeTempDir();
    const templatesDir = path.join(root, "templates");
    const stagingDir = path.join(root, "staging");

    await fs.ensureDir(templatesDir);
    await fs.ensureDir(stagingDir);
    await fs.writeFile(path.join(templatesDir, "styles.css"), "body { color: black; }", "utf8");
    await fs.writeFile(path.join(templatesDir, "app.js"), "console.log('ok');", "utf8");

    await copyAssets(templatesDir, stagingDir);

    expect(await fs.readFile(path.join(stagingDir, "styles.css"), "utf8")).toContain("color");
    expect(await fs.readFile(path.join(stagingDir, "app.js"), "utf8")).toContain("ok");
  });

  describe("参照画像コピー", () => {
    it("参照画像が assets/ 配下にコピーされること。", async () => {
      const root = await makeTempDir();
      const repoRoot = path.join(root, "repo");
      const templatesDir = path.join(root, "templates");
      const stagingDir = path.join(root, "staging");

      // セットアップ
      await fs.ensureDir(templatesDir);
      await fs.ensureDir(stagingDir);
      await fs.outputFile(path.join(templatesDir, "styles.css"), "body {}");
      await fs.outputFile(path.join(templatesDir, "app.js"), "console.log('ok');");
      await fs.outputFile(path.join(repoRoot, "docs", "assets", "screenshot.png"), "PNG_BINARY_DATA");

      // 参照画像一覧を渡してコピー実行
      const referencedImages = [{ repoRelativePath: "docs/assets/screenshot.png" }];
      await copyAssets(templatesDir, stagingDir, repoRoot, referencedImages);

      // T014実装により、参照画像がコピーされることを確認
      expect(await fs.pathExists(path.join(stagingDir, "assets", "docs", "assets", "screenshot.png"))).toBe(true);
      expect(await fs.readFile(path.join(stagingDir, "assets", "docs", "assets", "screenshot.png"), "utf8")).toBe(
        "PNG_BINARY_DATA",
      );
      // テンプレート資産も確認
      expect(await fs.readFile(path.join(stagingDir, "styles.css"), "utf8")).toContain("{}");
    });

    it("参照画像が存在しない場合はコピーをスキップし、既存ファイルのみコピーされること。", async () => {
      const root = await makeTempDir();
      const repoRoot = path.join(root, "repo");
      const templatesDir = path.join(root, "templates");
      const stagingDir = path.join(root, "staging");

      await fs.ensureDir(templatesDir);
      await fs.ensureDir(stagingDir);
      await fs.outputFile(path.join(templatesDir, "styles.css"), "body {}", "utf8");
      await fs.outputFile(path.join(templatesDir, "app.js"), "console.log('ok');", "utf8");
      await fs.outputFile(path.join(repoRoot, "docs", "assets", "exists.png"), "EXISTS", "utf8");

      await copyAssets(templatesDir, stagingDir, repoRoot, [
        { repoRelativePath: "docs/assets/exists.png" },
        { repoRelativePath: "docs/assets/missing.png" },
      ]);

      expect(await fs.pathExists(path.join(stagingDir, "assets", "docs", "assets", "exists.png"))).toBe(true);
      expect(await fs.pathExists(path.join(stagingDir, "assets", "docs", "assets", "missing.png"))).toBe(false);
    });
  });
});
