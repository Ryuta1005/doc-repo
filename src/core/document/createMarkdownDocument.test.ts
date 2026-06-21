import os from "node:os";
import path from "node:path";

import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

import { createMarkdownDocument } from "./createMarkdownDocument.js";

const tempDirs: string[] = [];

const makeTempDir = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "doc-repo-create-doc-"));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
});

describe("createMarkdownDocument", () => {
  it("creates markdown file with empty content by default", async () => {
    const rootDir = await makeTempDir();
    const target = path.join(rootDir, "docs", "new.md");

    await createMarkdownDocument({ targetAbsolutePath: target });

    await expect(fs.readFile(target, "utf8")).resolves.toBe("");
  });

  it("rejects duplicate creation", async () => {
    const rootDir = await makeTempDir();
    const target = path.join(rootDir, "docs", "new.md");
    await fs.outputFile(target, "# exists\n");

    await expect(createMarkdownDocument({ targetAbsolutePath: target })).rejects.toMatchObject({
      code: "ALREADY_EXISTS",
    });
  });
});
