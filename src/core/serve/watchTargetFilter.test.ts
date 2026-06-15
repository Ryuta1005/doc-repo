import path from "node:path";
import { describe, expect, it } from "vitest";

import { createWatchTargetFilter } from "./watchTargetFilter.js";

describe("createWatchTargetFilter", () => {
  it("rootDir 配下の .md ファイルが対象になること。", () => {
    const filter = createWatchTargetFilter({ rootDir: "/repo" });

    expect(filter.isTargetPath("/repo/docs/guide.md")).toBe(true);
  });

  it(".md 以外のファイルは対象外になること。", () => {
    const filter = createWatchTargetFilter({ rootDir: "/repo" });

    expect(filter.isTargetPath("/repo/docs/image.png")).toBe(false);
  });

  it("node_modules 配下は対象外になること。", () => {
    const filter = createWatchTargetFilter({ rootDir: "/repo" });

    expect(filter.isTargetPath("/repo/node_modules/pkg/README.md")).toBe(false);
  });

  it(".git 配下は対象外になること。", () => {
    const filter = createWatchTargetFilter({ rootDir: "/repo" });

    expect(filter.isTargetPath("/repo/.git/COMMIT_EDITMSG")).toBe(false);
  });

  it(".doc-repo 配下は対象外になること。", () => {
    const filter = createWatchTargetFilter({ rootDir: "/repo" });

    expect(filter.isTargetPath("/repo/.doc-repo/generated.md")).toBe(false);
  });

  it("dist 配下の Markdown は既定で対象になること。", () => {
    const filter = createWatchTargetFilter({ rootDir: "/repo" });

    expect(filter.isTargetPath("/repo/dist/notes.md")).toBe(true);
  });

  it("watch 作成時に node_modules などの既定除外ディレクトリを無視すること。", () => {
    const filter = createWatchTargetFilter({ rootDir: "/repo" });

    expect(filter.isIgnoredWatchPath("/repo/node_modules", false)).toBe(true);
    expect(filter.isIgnoredWatchPath("/repo/.git", false)).toBe(true);
    expect(filter.isIgnoredWatchPath("/repo/.doc-repo", false)).toBe(true);
  });

  it("watch 作成時に通常ディレクトリは探索できること。", () => {
    const filter = createWatchTargetFilter({ rootDir: "/repo" });

    expect(filter.isIgnoredWatchPath("/repo/docs", false)).toBe(false);
  });

  it("watch 作成時に Markdown 以外のファイルを無視すること。", () => {
    const filter = createWatchTargetFilter({ rootDir: "/repo" });

    expect(filter.isIgnoredWatchPath("/repo/docs/guide.md", true)).toBe(false);
    expect(filter.isIgnoredWatchPath("/repo/docs/image.png", true)).toBe(true);
  });

  it("rootDir 外のパスは対象外になること。", () => {
    const filter = createWatchTargetFilter({ rootDir: "/repo" });

    expect(filter.isTargetPath("/other/README.md")).toBe(false);
  });

  describe("includePatterns", () => {
    it("includePatterns に一致するファイルが対象になること。", () => {
      const filter = createWatchTargetFilter({
        rootDir: "/repo",
        includePatterns: ["docs/**"],
      });

      expect(filter.isTargetPath("/repo/docs/guide.md")).toBe(true);
    });

    it("includePatterns に一致しないファイルは対象外になること。", () => {
      const filter = createWatchTargetFilter({
        rootDir: "/repo",
        includePatterns: ["docs/**"],
      });

      expect(filter.isTargetPath("/repo/drafts/wip.md")).toBe(false);
      expect(filter.isIgnoredWatchPath("/repo/drafts/wip.md", true)).toBe(true);
    });

    it("includePatterns が空配列の場合、全 .md が対象になること。", () => {
      const filter = createWatchTargetFilter({
        rootDir: "/repo",
        includePatterns: [],
      });

      expect(filter.isTargetPath("/repo/any/file.md")).toBe(true);
    });
  });

  describe("excludePatterns", () => {
    it("excludePatterns に一致するファイルは対象外になること。", () => {
      const filter = createWatchTargetFilter({
        rootDir: "/repo",
        excludePatterns: ["drafts/**"],
      });

      expect(filter.isTargetPath("/repo/drafts/wip.md")).toBe(false);
      expect(filter.isIgnoredWatchPath("/repo/drafts/wip.md", true)).toBe(true);
    });

    it("exclude は include より優先されること。", () => {
      const filter = createWatchTargetFilter({
        rootDir: "/repo",
        includePatterns: ["docs/**"],
        excludePatterns: ["docs/private/**"],
      });

      expect(filter.isTargetPath("/repo/docs/guide.md")).toBe(true);
      expect(filter.isTargetPath("/repo/docs/private/secret.md")).toBe(false);
    });

    it("** を含むグロブパターンが一致すること。", () => {
      const filter = createWatchTargetFilter({
        rootDir: "/repo",
        includePatterns: ["specs/**/*.md"],
        excludePatterns: ["specs/manual-tests/**"],
      });

      expect(filter.isTargetPath("/repo/specs/007-config/spec.md")).toBe(true);
      expect(filter.isTargetPath("/repo/specs/manual-tests/test-case.md")).toBe(false);
      expect(filter.isTargetPath("/repo/docs/guide.md")).toBe(false);
    });
  });
});
