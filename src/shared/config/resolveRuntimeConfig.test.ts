import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

import { resolveRuntimeConfig } from "./resolveRuntimeConfig.js";

const tempDirs: string[] = [];

const makeTempDir = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "doc-repo-test-"));
  tempDirs.push(dir);
  return dir;
};

/** git リポジトリの外に一時ディレクトリを作る（cwd-fallback テスト用）*/
const makeTempDirOutsideGit = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "doc-repo-test-"));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
});

describe("resolveRuntimeConfig", () => {
  // ---------------------------------------------------------------
  // rootDir resolution
  // ---------------------------------------------------------------

  describe("rootDir resolution", () => {
    it("設定ファイルの rootDir（相対）が設定ファイル基準で解決されること。", async () => {
      const root = await makeTempDir();
      const docsDir = path.join(root, "docs");
      await fs.ensureDir(docsDir);
      await fs.outputJson(path.join(root, "doc-repo.config.json"), { rootDir: "./docs" });

      const result = await resolveRuntimeConfig({ cwd: root });

      expect(result.rootDir).toBe(docsDir);
      expect(result.rootSource).toBe("config-rootDir");
      expect(result.configPath).toBe(path.join(root, "doc-repo.config.json"));
    });

    it("設定ファイルの rootDir（絶対）がそのまま使われること。", async () => {
      const root = await makeTempDir();
      const docsDir = path.join(root, "docs");
      await fs.ensureDir(docsDir);
      await fs.outputJson(path.join(root, "doc-repo.config.json"), { rootDir: docsDir });

      const result = await resolveRuntimeConfig({ cwd: root });

      expect(result.rootDir).toBe(docsDir);
      expect(result.rootSource).toBe("config-rootDir");
    });

    it("設定ファイルがあり rootDir がない場合、設定ファイルのディレクトリが rootDir になること。", async () => {
      const root = await makeTempDir();
      await fs.outputJson(path.join(root, "doc-repo.config.json"), {});

      const result = await resolveRuntimeConfig({ cwd: root });

      expect(result.rootDir).toBe(root);
      expect(result.rootSource).toBe("config-directory");
    });

    it("設定ファイルがない場合、.git ルートが使われること。", async () => {
      const root = await makeTempDir();
      await fs.ensureDir(path.join(root, ".git"));

      const subDir = path.join(root, "sub");
      await fs.ensureDir(subDir);

      const result = await resolveRuntimeConfig({ cwd: subDir });

      expect(result.rootDir).toBe(root);
      expect(result.rootSource).toBe("git-root");
      expect(result.configPath).toBeNull();
    });

    it("設定ファイルも .git もない場合、cwd が rootDir になること。", async () => {
      const root = await makeTempDirOutsideGit();

      const result = await resolveRuntimeConfig({ cwd: root });

      expect(result.rootDir).toBe(root);
      expect(result.rootSource).toBe("cwd-fallback");
      expect(result.configPath).toBeNull();
    });
  });

  // ---------------------------------------------------------------
  // port resolution
  // ---------------------------------------------------------------

  describe("port resolution", () => {
    it("CLI port が設定ファイルより優先されること。", async () => {
      const root = await makeTempDir();
      await fs.outputJson(path.join(root, "doc-repo.config.json"), { port: 4100 });

      const result = await resolveRuntimeConfig({ cwd: root, cliPort: 4500 });

      expect(result.port).toBe(4500);
      expect(result.portSource).toBe("cli");
    });

    it("設定ファイルに port があれば config が採用されること。", async () => {
      const root = await makeTempDir();
      await fs.outputJson(path.join(root, "doc-repo.config.json"), { port: 4200 });

      const result = await resolveRuntimeConfig({ cwd: root });

      expect(result.port).toBe(4200);
      expect(result.portSource).toBe("config");
    });

    it("port が未指定の場合、デフォルト 4000 が使われること。", async () => {
      const root = await makeTempDir();

      const result = await resolveRuntimeConfig({ cwd: root });

      expect(result.port).toBe(4000);
      expect(result.portSource).toBe("default");
    });
  });

  // ---------------------------------------------------------------
  // include / exclude
  // ---------------------------------------------------------------

  describe("include/exclude patterns", () => {
    it("設定ファイルの include/exclude がそのまま返ること。", async () => {
      const root = await makeTempDir();
      await fs.outputJson(path.join(root, "doc-repo.config.json"), {
        include: ["docs/**"],
        exclude: ["drafts/**"],
      });

      const result = await resolveRuntimeConfig({ cwd: root });

      expect(result.includePatterns).toEqual(["docs/**"]);
      expect(result.excludePatterns).toEqual(["drafts/**"]);
    });

    it("設定ファイルに include/exclude がない場合、空配列が返ること。", async () => {
      const root = await makeTempDir();
      await fs.outputJson(path.join(root, "doc-repo.config.json"), {});

      const result = await resolveRuntimeConfig({ cwd: root });

      expect(result.includePatterns).toEqual([]);
      expect(result.excludePatterns).toEqual([]);
    });
  });

  // ---------------------------------------------------------------
  // outputDir
  // ---------------------------------------------------------------

  it("outputDir が rootDir/.doc-repo になること。", async () => {
    const root = await makeTempDir();
    await fs.outputJson(path.join(root, "doc-repo.config.json"), {});

    const result = await resolveRuntimeConfig({ cwd: root });

    expect(result.outputDir).toBe(path.join(root, ".doc-repo"));
  });

  // ---------------------------------------------------------------
  // validation failures
  // ---------------------------------------------------------------

  describe("validation failures", () => {
    it("port が非整数の場合、CONFIG_INVALID_PORT で失敗すること。", async () => {
      const root = await makeTempDir();
      await fs.outputJson(path.join(root, "doc-repo.config.json"), { port: "abc" });

      await expect(resolveRuntimeConfig({ cwd: root })).rejects.toMatchObject({
        code: "CONFIG_INVALID_PORT",
      });
    });

    it("CLI port が範囲外の場合、CONFIG_INVALID_PORT で失敗すること。", async () => {
      const root = await makeTempDir();

      await expect(resolveRuntimeConfig({ cwd: root, cliPort: 70000 })).rejects.toMatchObject({
        code: "CONFIG_INVALID_PORT",
      });
    });

    it("include が文字列配列でない場合、CONFIG_INVALID_PATTERN で失敗すること。", async () => {
      const root = await makeTempDir();
      await fs.outputJson(path.join(root, "doc-repo.config.json"), { include: "docs/**" });

      await expect(resolveRuntimeConfig({ cwd: root })).rejects.toMatchObject({
        code: "CONFIG_INVALID_PATTERN",
      });
    });

    it("exclude が文字列配列でない場合、CONFIG_INVALID_PATTERN で失敗すること。", async () => {
      const root = await makeTempDir();
      await fs.outputJson(path.join(root, "doc-repo.config.json"), { exclude: 42 });

      await expect(resolveRuntimeConfig({ cwd: root })).rejects.toMatchObject({
        code: "CONFIG_INVALID_PATTERN",
      });
    });

    it("rootDir が存在しないパスの場合、CONFIG_ROOT_DIR_NOT_FOUND で失敗すること。", async () => {
      const root = await makeTempDir();
      await fs.outputJson(path.join(root, "doc-repo.config.json"), {
        rootDir: "./nonexistent",
      });

      await expect(resolveRuntimeConfig({ cwd: root })).rejects.toMatchObject({
        code: "CONFIG_ROOT_DIR_NOT_FOUND",
      });
    });

    it("rootDir がファイルのパスの場合、CONFIG_ROOT_DIR_NOT_DIRECTORY で失敗すること。", async () => {
      const root = await makeTempDir();
      await fs.outputFile(path.join(root, "README.md"), "# hi");
      await fs.outputJson(path.join(root, "doc-repo.config.json"), {
        rootDir: "./README.md",
      });

      await expect(resolveRuntimeConfig({ cwd: root })).rejects.toMatchObject({
        code: "CONFIG_ROOT_DIR_NOT_DIRECTORY",
      });
    });
  });
});
