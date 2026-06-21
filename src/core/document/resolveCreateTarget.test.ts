import os from "node:os";
import path from "node:path";

import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

import { resolveCreateTarget } from "./resolveCreateTarget.js";

const tempDirs: string[] = [];

const makeTempDir = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "doc-repo-create-target-"));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
});

describe("resolveCreateTarget", () => {
  it("resolves folder anchor create target under rootDir", async () => {
    const rootDir = await makeTempDir();
    await fs.ensureDir(path.join(rootDir, "docs"));

    await expect(
      resolveCreateTarget({
        rootDir,
        anchor: { nodeType: "folder", nodePath: "docs" },
        filename: "new-guide",
        includePatterns: ["docs/**/*.md"],
      }),
    ).resolves.toMatchObject({
      targetIdentifier: "docs/new-guide.md",
      displayName: "new-guide",
    });
  });

  it("treats non-md suffixes as filename text and appends .md", async () => {
    const rootDir = await makeTempDir();
    await fs.ensureDir(path.join(rootDir, "docs"));

    await expect(
      resolveCreateTarget({
        rootDir,
        anchor: { nodeType: "folder", nodePath: "docs" },
        filename: "new-guide.txt",
      }),
    ).resolves.toMatchObject({
      targetIdentifier: "docs/new-guide.txt.md",
      displayName: "new-guide.txt",
    });
  });

  it("treats explicit .md suffixes as filename text and appends .md", async () => {
    const rootDir = await makeTempDir();
    await fs.ensureDir(path.join(rootDir, "docs"));

    await expect(
      resolveCreateTarget({
        rootDir,
        anchor: { nodeType: "folder", nodePath: "docs" },
        filename: "a.md",
      }),
    ).resolves.toMatchObject({
      targetIdentifier: "docs/a.md.md",
      displayName: "a.md",
    });
  });

  it("allows dotted markdown names by appending .md to the requested name", async () => {
    const rootDir = await makeTempDir();
    await fs.ensureDir(path.join(rootDir, "docs"));

    await expect(
      resolveCreateTarget({
        rootDir,
        anchor: { nodeType: "folder", nodePath: "docs" },
        filename: "doc.ja",
      }),
    ).resolves.toMatchObject({
      targetIdentifier: "docs/doc.ja.md",
      displayName: "doc.ja",
    });
  });

  it("rejects path-like filename segments", async () => {
    const rootDir = await makeTempDir();
    await fs.ensureDir(path.join(rootDir, "docs"));

    await expect(
      resolveCreateTarget({
        rootDir,
        anchor: { nodeType: "folder", nodePath: "docs" },
        filename: "..",
      }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT", message: "filename must not be a path segment" });
  });

  it("rejects excluded targets", async () => {
    const rootDir = await makeTempDir();
    await fs.ensureDir(path.join(rootDir, "docs", "draft"));

    await expect(
      resolveCreateTarget({
        rootDir,
        anchor: { nodeType: "folder", nodePath: "docs/draft" },
        filename: "blocked",
        includePatterns: ["docs/**/*.md"],
        excludePatterns: ["**/draft/**"],
      }),
    ).rejects.toMatchObject({ code: "OUT_OF_SCOPE" });
  });
});
