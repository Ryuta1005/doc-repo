import os from "node:os";
import path from "node:path";

import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

import { inspectFolderDeletionScope } from "./inspectFolderDeletionScope.js";

const tempDirs: string[] = [];

const makeTempDir = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "doc-repo-folder-preflight-"));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
});

describe("inspectFolderDeletionScope", () => {
  it("returns deletable=true for an empty folder", async () => {
    const rootDir = await makeTempDir();
    const folderAbsolutePath = path.join(rootDir, "docs", "empty");
    await fs.ensureDir(folderAbsolutePath);

    const report = await inspectFolderDeletionScope({
      rootDir,
      folderAbsolutePath,
      folderRelativePath: "docs/empty",
      includePatterns: ["docs/**/*.md"],
    });

    expect(report).toEqual({
      managedMarkdownIdentifiers: [],
      unmanagedEntries: [],
      deletable: true,
    });
  });

  it("accepts managed markdown-only entries", async () => {
    const rootDir = await makeTempDir();
    const folderAbsolutePath = path.join(rootDir, "docs", "managed");
    await fs.outputFile(path.join(folderAbsolutePath, "a.md"), "# A\n");
    await fs.outputFile(path.join(folderAbsolutePath, "b.md"), "# B\n");

    const report = await inspectFolderDeletionScope({
      rootDir,
      folderAbsolutePath,
      folderRelativePath: "docs/managed",
      includePatterns: ["docs/**/*.md"],
      excludePatterns: ["**/draft/**"],
    });

    expect(report.deletable).toBe(true);
    expect(report.unmanagedEntries).toEqual([]);
    expect(report.managedMarkdownIdentifiers.sort()).toEqual(["docs/managed/a.md", "docs/managed/b.md"]);
  });

  it("rejects mixed folders containing unmanaged files", async () => {
    const rootDir = await makeTempDir();
    const folderAbsolutePath = path.join(rootDir, "docs", "mixed");
    await fs.outputFile(path.join(folderAbsolutePath, "note.md"), "# note\n");
    await fs.outputFile(path.join(folderAbsolutePath, "image.png"), "PNG");

    const report = await inspectFolderDeletionScope({
      rootDir,
      folderAbsolutePath,
      folderRelativePath: "docs/mixed",
      includePatterns: ["docs/**/*.md"],
    });

    expect(report.deletable).toBe(false);
    expect(report.managedMarkdownIdentifiers).toEqual(["docs/mixed/note.md"]);
    expect(report.unmanagedEntries).toEqual(["docs/mixed/image.png"]);
  });

  it("rejects deeply-nested folder when unmanaged entry exists", async () => {
    const rootDir = await makeTempDir();
    const folderAbsolutePath = path.join(rootDir, "docs", "nested");
    await fs.outputFile(path.join(folderAbsolutePath, "lv1", "lv2", "ok.md"), "# ok\n");
    await fs.outputFile(path.join(folderAbsolutePath, "lv1", "lv2", "asset.svg"), "<svg />");

    const report = await inspectFolderDeletionScope({
      rootDir,
      folderAbsolutePath,
      folderRelativePath: "docs/nested",
      includePatterns: ["docs/**/*.md"],
    });

    expect(report.deletable).toBe(false);
    expect(report.managedMarkdownIdentifiers).toContain("docs/nested/lv1/lv2/ok.md");
    expect(report.unmanagedEntries).toContain("docs/nested/lv1/lv2/asset.svg");
  });

  it("marks out-of-scope include/exclude entries as unmanaged", async () => {
    const rootDir = await makeTempDir();
    const folderAbsolutePath = path.join(rootDir, "docs", "scope");
    await fs.outputFile(path.join(folderAbsolutePath, "included.md"), "# included\n");
    await fs.outputFile(path.join(folderAbsolutePath, "draft", "hidden.md"), "# hidden\n");

    const report = await inspectFolderDeletionScope({
      rootDir,
      folderAbsolutePath,
      folderRelativePath: "docs/scope",
      includePatterns: ["docs/**/*.md"],
      excludePatterns: ["**/draft/**"],
    });

    expect(report.deletable).toBe(false);
    expect(report.managedMarkdownIdentifiers).toEqual(["docs/scope/included.md"]);
    expect(report.unmanagedEntries).toContain("docs/scope/draft/hidden.md");
  });
});
