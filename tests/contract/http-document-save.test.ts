import os from "node:os";
import path from "node:path";

import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

import { createHttpBoundaryPipeline } from "../../src/presentation/http/createServer.js";

const tempDirs: string[] = [];

const makeTempDir = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "doc-repo-http-save-"));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
});

describe("http-document-save contract", () => {
  it("POST /api/document/save 相当で保存できること。", async () => {
    const rootDir = await makeTempDir();
    const targetPath = path.join(rootDir, "docs", "guide", "getting-started.md");
    await fs.outputFile(targetPath, "# Getting Started\n\nBody\n");

    const pipeline = createHttpBoundaryPipeline({ rootDir });
    const result = await pipeline.saveDocument({
      identifier: "docs/guide/getting-started.md",
      markdownContent: "# Getting Started\n\nUpdated body\n",
      options: { newlineStyle: "lf", hasTrailingNewline: true },
    });

    expect(result).toMatchObject({
      status: "saved",
      savedDocument: { identifier: "docs/guide/getting-started.md" },
      warnings: [],
    });
    expect(await fs.readFile(targetPath, "utf8")).toBe("# Getting Started\n\nUpdated body\n");
  });

  it("filename を変更した場合は同じ階層でリネームして保存できること。", async () => {
    const rootDir = await makeTempDir();
    const sourcePath = path.join(rootDir, "docs", "guide", "getting-started.md");
    const targetPath = path.join(rootDir, "docs", "guide", "updated.md");
    await fs.outputFile(sourcePath, "# Getting Started\n\nBody\n");

    const pipeline = createHttpBoundaryPipeline({ rootDir });
    const result = await pipeline.saveDocument({
      identifier: "docs/guide/updated.md",
      originalIdentifier: "docs/guide/getting-started.md",
      markdownContent: "# Getting Started\n\nUpdated body\n",
      options: { newlineStyle: "lf", hasTrailingNewline: true },
    });

    expect(result).toMatchObject({
      status: "saved",
      savedDocument: { identifier: "docs/guide/updated.md" },
      warnings: [],
    });
    expect(await fs.pathExists(sourcePath)).toBe(false);
    expect(await fs.readFile(targetPath, "utf8")).toBe("# Getting Started\n\nUpdated body\n");
  });

  it("未対応要素がある場合は warning を返すこと。", async () => {
    const rootDir = await makeTempDir();
    const targetPath = path.join(rootDir, "docs", "guide", "getting-started.md");
    await fs.outputFile(targetPath, "# Title\n\n<div>raw</div>\n");

    const pipeline = createHttpBoundaryPipeline({ rootDir });
    const result = await pipeline.saveDocument({
      identifier: "docs/guide/getting-started.md",
      markdownContent: "# Title\n\n<div>raw</div>\n",
      options: { newlineStyle: "lf", hasTrailingNewline: true },
    });

    expect(result).toMatchObject({
      status: "warning",
      allowProceed: true,
    });
  });

  it("不正な対象は invalid-target になること。", async () => {
    const rootDir = await makeTempDir();
    const pipeline = createHttpBoundaryPipeline({ rootDir });

    await expect(
      pipeline.saveDocument({
        identifier: "../outside.md",
        markdownContent: "# invalid",
        options: { newlineStyle: "lf", hasTrailingNewline: true },
      }),
    ).resolves.toMatchObject({
      status: "failed",
      error: { category: "invalid-target", code: "SAVE_TARGET_INVALID", retryable: false },
    });
  });

  it("保存対象外の拡張子は invalid-target になること。", async () => {
    const rootDir = await makeTempDir();
    const pipeline = createHttpBoundaryPipeline({ rootDir });

    await expect(
      pipeline.saveDocument({
        identifier: "docs/sample.txt",
        markdownContent: "# invalid",
        options: { newlineStyle: "lf", hasTrailingNewline: true },
      }),
    ).resolves.toMatchObject({
      status: "failed",
      error: { category: "invalid-target", code: "SAVE_TARGET_INVALID", retryable: false },
    });
  });

  it("include 条件外の対象は invalid-target になること。", async () => {
    const rootDir = await makeTempDir();
    const targetPath = path.join(rootDir, "private", "note.md");
    await fs.outputFile(targetPath, "# hidden\n");

    const pipeline = createHttpBoundaryPipeline({
      rootDir,
      includePatterns: ["docs/**/*.md"],
    });

    await expect(
      pipeline.saveDocument({
        identifier: "private/note.md",
        markdownContent: "# hidden updated\n",
        options: { newlineStyle: "lf", hasTrailingNewline: true },
      }),
    ).resolves.toMatchObject({
      status: "failed",
      error: { category: "invalid-target", code: "SAVE_TARGET_INVALID", retryable: false },
    });
  });

  it("exclude 条件に該当する対象は invalid-target になること。", async () => {
    const rootDir = await makeTempDir();
    const targetPath = path.join(rootDir, "docs", "draft", "note.md");
    await fs.outputFile(targetPath, "# draft\n");

    const pipeline = createHttpBoundaryPipeline({
      rootDir,
      includePatterns: ["docs/**/*.md"],
      excludePatterns: ["**/draft/**"],
    });

    await expect(
      pipeline.saveDocument({
        identifier: "docs/draft/note.md",
        markdownContent: "# draft updated\n",
        options: { newlineStyle: "lf", hasTrailingNewline: true },
      }),
    ).resolves.toMatchObject({
      status: "failed",
      error: { category: "invalid-target", code: "SAVE_TARGET_INVALID", retryable: false },
    });
  });
});
