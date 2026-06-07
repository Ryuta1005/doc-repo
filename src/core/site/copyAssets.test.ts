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
  it("templates 配下の styles.css を staging にコピーできること。", async () => {
    const root = await makeTempDir();
    const templatesDir = path.join(root, "templates");
    const stagingDir = path.join(root, "staging");

    await fs.ensureDir(templatesDir);
    await fs.ensureDir(stagingDir);
    await fs.writeFile(path.join(templatesDir, "styles.css"), "body { color: black; }", "utf8");

    await copyAssets(templatesDir, stagingDir);

    expect(await fs.readFile(path.join(stagingDir, "styles.css"), "utf8")).toContain("color");
  });
});
