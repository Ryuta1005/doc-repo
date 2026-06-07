import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

import { detectRoot } from "./detectRoot.js";

const tempDirs: string[] = [];

const makeTempDir = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "doc-repo-detect-root-"));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
});

describe("detectRoot.ts", () => {
  it("親ディレクトリに .git が存在する場合、そのパスが検出されること。", async () => {
    const root = await makeTempDir();
    const nested = path.join(root, "a", "b");
    await fs.ensureDir(path.join(root, ".git"));
    await fs.ensureDir(nested);

    const result = await detectRoot(nested);

    expect(result).toEqual({
      detectedRoot: root,
      usedFallback: false,
    });
  });

  it(".git が見つからない場合、入力 cwd が fallback として返却されること。", async () => {
    const cwd = await makeTempDir();

    const result = await detectRoot(cwd);

    expect(result).toEqual({
      detectedRoot: cwd,
      usedFallback: true,
    });
  });
});
