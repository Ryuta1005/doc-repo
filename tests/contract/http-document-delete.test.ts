import os from "node:os";
import path from "node:path";

import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

import { createHttpBoundaryPipeline } from "../../src/presentation/http/createServer.js";

const tempDirs: string[] = [];

const makeTempDir = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "doc-repo-http-delete-"));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
});

describe("http-document-delete contract", () => {
  it("deletes file target and returns deleted payload", async () => {
    const rootDir = await makeTempDir();
    const targetPath = path.join(rootDir, "docs", "guide.md");
    await fs.outputFile(targetPath, "# guide\n");

    const pipeline = createHttpBoundaryPipeline({ rootDir });
    const result = await pipeline.deleteDocument({
      target: {
        targetType: "file",
        path: "docs/guide.md",
        displayName: "guide",
      },
    });

    expect(result).toMatchObject({
      status: "deleted",
      removed: {
        identifiers: ["docs/guide.md"],
        directories: [],
      },
    });
    expect(result).not.toHaveProperty("selection");
    await expect(fs.pathExists(targetPath)).resolves.toBe(false);
  });

  it("deletes folder target recursively when only managed markdown exists", async () => {
    const rootDir = await makeTempDir();
    await fs.outputFile(path.join(rootDir, "docs", "guides", "a.md"), "# a\n");
    await fs.outputFile(path.join(rootDir, "docs", "guides", "b.md"), "# b\n");

    const pipeline = createHttpBoundaryPipeline({
      rootDir,
      includePatterns: ["docs/**/*.md"],
      excludePatterns: ["**/draft/**"],
    });
    const result = await pipeline.deleteDocument({
      target: {
        targetType: "folder",
        path: "docs/guides",
        displayName: "guides",
      },
    });

    expect(result).toMatchObject({
      status: "deleted",
      removed: {
        identifiers: ["docs/guides/a.md", "docs/guides/b.md"],
        directories: ["docs/guides"],
      },
    });
    await expect(fs.pathExists(path.join(rootDir, "docs", "guides"))).resolves.toBe(false);
  });

  it("deletes managed markdown in folder and preserves unmanaged entries", async () => {
    const rootDir = await makeTempDir();
    const folderPath = path.join(rootDir, "docs", "mixed");
    await fs.outputFile(path.join(folderPath, "note.md"), "# note\n");
    await fs.outputFile(path.join(folderPath, "image.png"), "PNG");

    const pipeline = createHttpBoundaryPipeline({
      rootDir,
      includePatterns: ["docs/**/*.md"],
    });
    const result = await pipeline.deleteDocument({
      target: {
        targetType: "folder",
        path: "docs/mixed",
        displayName: "mixed",
      },
    });

    expect(result).toMatchObject({
      status: "deleted",
      removed: {
        identifiers: ["docs/mixed/note.md"],
        directories: [],
      },
    });
    await expect(fs.pathExists(path.join(folderPath, "note.md"))).resolves.toBe(false);
    await expect(fs.pathExists(path.join(folderPath, "image.png"))).resolves.toBe(true);
    await expect(fs.pathExists(folderPath)).resolves.toBe(true);
  });

  it("preserves excluded entries when deleting an ancestor folder", async () => {
    const rootDir = await makeTempDir();
    const folderPath = path.join(rootDir, "specs", "007-config-file-settings");
    await fs.outputFile(path.join(folderPath, "spec.md"), "# spec\n");
    await fs.outputFile(path.join(folderPath, "contracts", "cli-contract.md"), "# contract\n");
    await fs.outputFile(path.join(folderPath, "quickstart.md"), "# quickstart\n");

    const pipeline = createHttpBoundaryPipeline({
      rootDir,
      includePatterns: ["specs/**/*.md"],
      excludePatterns: ["specs/007-config-file-settings/contracts/**"],
    });
    const result = await pipeline.deleteDocument({
      target: {
        targetType: "folder",
        path: "specs/007-config-file-settings",
        displayName: "007-config-file-settings",
      },
    });

    expect(result).toMatchObject({
      status: "deleted",
      removed: {
        identifiers: ["specs/007-config-file-settings/quickstart.md", "specs/007-config-file-settings/spec.md"],
      },
    });
    await expect(fs.pathExists(path.join(folderPath, "spec.md"))).resolves.toBe(false);
    await expect(fs.pathExists(path.join(folderPath, "quickstart.md"))).resolves.toBe(false);
    await expect(fs.pathExists(path.join(folderPath, "contracts", "cli-contract.md"))).resolves.toBe(true);
    await expect(fs.pathExists(path.join(folderPath, "contracts"))).resolves.toBe(true);
  });
});
