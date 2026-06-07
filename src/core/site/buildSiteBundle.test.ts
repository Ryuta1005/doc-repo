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
});
