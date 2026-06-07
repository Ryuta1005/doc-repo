import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it, vi } from "vitest";

import { atomicPublish } from "./atomicPublish.js";

const tempDirs: string[] = [];

const makeTempDir = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "doc-repo-atomic-publish-"));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
});

describe("atomicPublish.ts", () => {
  it("出力先が存在する場合、staging の内容で置換されること。", async () => {
    const root = await makeTempDir();
    const outputDir = path.join(root, "output");
    const stagingDir = path.join(root, "staging");

    await fs.outputFile(path.join(outputDir, "index.html"), "old");
    await fs.outputFile(path.join(stagingDir, "index.html"), "new");

    await atomicPublish(stagingDir, outputDir);

    expect(await fs.readFile(path.join(outputDir, "index.html"), "utf8")).toBe("new");
    expect(await fs.pathExists(`${outputDir}.__backup__`)).toBe(false);
  });

  it("公開処理で失敗した場合、既存 output が復元されること。", async () => {
    const root = await makeTempDir();
    const outputDir = path.join(root, "output");
    const stagingDir = path.join(root, "staging");
    const backupDir = `${outputDir}.__backup__`;

    await fs.outputFile(path.join(outputDir, "index.html"), "old");
    await fs.outputFile(path.join(stagingDir, "index.html"), "new");

    const originalMove = fs.move.bind(fs);
    const moveSpy = vi.spyOn(fs, "move").mockImplementation(async (src, dest, options) => {
      if (src === stagingDir && dest === outputDir) {
        throw new Error("publish failed");
      }
      return originalMove(src, dest, options);
    });

    await expect(atomicPublish(stagingDir, outputDir)).rejects.toThrow("publish failed");

    expect(await fs.pathExists(backupDir)).toBe(false);
    expect(await fs.readFile(path.join(outputDir, "index.html"), "utf8")).toBe("old");
    expect(await fs.pathExists(stagingDir)).toBe(false);
    expect(moveSpy).toHaveBeenCalled();
  });
});
