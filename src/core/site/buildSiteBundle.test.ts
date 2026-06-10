import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

import { buildSiteBundle } from "./buildSiteBundle.js";

const tempDirs: string[] = [];

const makeTempDir = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "doc-repo-build-bundle-"));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
});

describe("buildSiteBundle.ts", () => {
  it("複数 Markdown を渡した場合、pages とツリー構造が構築されること。", async () => {
    const root = await makeTempDir();
    await fs.outputFile(path.join(root, "docs", "guide", "b.md"), "# B");
    await fs.outputFile(path.join(root, "docs", "guide", "a.md"), "# A");

    const bundle = await buildSiteBundle([
      {
        absolutePath: path.join(root, "docs", "guide", "b.md"),
        relativePath: "docs/guide/b.md",
      },
      {
        absolutePath: path.join(root, "docs", "guide", "a.md"),
        relativePath: "docs/guide/a.md",
      },
    ]);

    expect(bundle.pages.map((p) => p.id)).toEqual(["docs/guide/b", "docs/guide/a"]);
    expect(bundle.tree).toEqual([
      {
        type: "dir",
        name: "docs",
        children: [
          {
            type: "dir",
            name: "guide",
            children: [
              { type: "file", name: "a.md", id: "docs/guide/a" },
              { type: "file", name: "b.md", id: "docs/guide/b" },
            ],
          },
        ],
      },
    ]);
  });

  it("読み取り失敗時、エラーメッセージに対象 relativePath が含まれること。", async () => {
    const root = await makeTempDir();

    await expect(
      buildSiteBundle([
        {
          absolutePath: path.join(root, "missing.md"),
          relativePath: "docs/missing.md",
        },
      ]),
    ).rejects.toThrow("docs/missing.md");
  });

  // T009: SiteBundle が参照画像一覧を集約するテスト
  describe("T009: SiteBundle の参照画像集約", () => {
    it("referencedImages フィールドが常に存在すること（現在は空配列）。", async () => {
      const root = await makeTempDir();
      await fs.outputFile(path.join(root, "docs", "simple.md"), "# Simple");

      const bundle = await buildSiteBundle([
        {
          absolutePath: path.join(root, "docs", "simple.md"),
          relativePath: "docs/simple.md",
        },
      ]);

      expect(bundle).toHaveProperty("referencedImages");
      expect(Array.isArray(bundle.referencedImages)).toBe(true);
    });

    it("複数ページの参照画像が集約される（T012 実装後に値が入る）。", async () => {
      const root = await makeTempDir();
      // T013: buildSiteBundle が参照画像を集約するようになったため、実装対応
      await fs.outputFile(path.join(root, "page1.md"), "![img1](./assets/a.png)");
      await fs.outputFile(path.join(root, "page2.md"), "![img2](./assets/b.png)");

      const bundle = await buildSiteBundle([
        {
          absolutePath: path.join(root, "page1.md"),
          relativePath: "page1.md",
        },
        {
          absolutePath: path.join(root, "page2.md"),
          relativePath: "page2.md",
        },
      ]);

      // T013実装により、参照画像が集約されるようになった
      expect(bundle.referencedImages).toEqual([
        { repoRelativePath: "assets/a.png" },
        { repoRelativePath: "assets/b.png" },
      ]);
    });
  });
});
