import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

import { resolveServeOptions } from "./resolveServeOptions.js";

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

describe("resolveServeOptions", () => {
  it("CLI の port が設定ファイルより優先されること。", async () => {
    const root = await makeTempDir();
    await fs.outputJson(path.join(root, "doc-repo.config.json"), { port: 4100 });

    const result = await resolveServeOptions({ cwd: root, cliPort: 4500 });

    expect(result.port).toBe(4500);
    expect(result.portSource).toBe("cli");
    expect(result.includePatterns).toEqual([]);
    expect(result.excludePatterns).toEqual([]);
  });

  it("設定ファイルに port がある場合、config が採用されること。", async () => {
    const root = await makeTempDir();
    await fs.outputJson(path.join(root, "doc-repo.config.json"), { port: 4200 });

    const result = await resolveServeOptions({ cwd: root });

    expect(result.port).toBe(4200);
    expect(result.portSource).toBe("config");
    expect(result.includePatterns).toEqual([]);
    expect(result.excludePatterns).toEqual([]);
  });

  it("CLI と設定ファイルの両方に指定がない場合、default=4000 になること。", async () => {
    const root = await makeTempDir();

    const result = await resolveServeOptions({ cwd: root });

    expect(result.port).toBe(4000);
    expect(result.portSource).toBe("default");
    expect(result.includePatterns).toEqual([]);
    expect(result.excludePatterns).toEqual([]);
  });

  it("port が非整数の場合、invalid-port で失敗すること。", async () => {
    const root = await makeTempDir();
    await fs.outputJson(path.join(root, "doc-repo.config.json"), { port: "abc" });

    await expect(resolveServeOptions({ cwd: root })).rejects.toMatchObject({
      code: "CONFIG_INVALID_PORT",
    });
  });

  it("port が範囲外の場合、invalid-port で失敗すること。", async () => {
    const root = await makeTempDir();

    await expect(resolveServeOptions({ cwd: root, cliPort: 70000 })).rejects.toMatchObject({
      code: "CONFIG_INVALID_PORT",
    });
  });

  it("include/exclude が設定されている場合、配列として返すこと。", async () => {
    const root = await makeTempDir();
    await fs.outputJson(path.join(root, "doc-repo.config.json"), {
      include: ["docs/"],
      exclude: ["docs/private/"],
    });

    const result = await resolveServeOptions({ cwd: root });

    expect(result.includePatterns).toEqual(["docs/"]);
    expect(result.excludePatterns).toEqual(["docs/private/"]);
  });

  it("設定ファイルも .git もない場合、cwd-fallback で rootDir が解決されること。", async () => {
    const root = await makeTempDirOutsideGit();

    const result = await resolveServeOptions({ cwd: root });

    expect(result.rootDir).toBe(root);
    expect(result.rootSource).toBe("cwd-fallback");
    expect(result.port).toBe(4000);
  });

  it(".git があり設定ファイルがない場合、git-root で rootDir が解決されること。", async () => {
    const root = await makeTempDir();
    await fs.ensureDir(path.join(root, ".git"));
    const subDir = path.join(root, "sub");
    await fs.ensureDir(subDir);

    const result = await resolveServeOptions({ cwd: subDir });

    expect(result.rootDir).toBe(root);
    expect(result.rootSource).toBe("git-root");
  });

  it("設定ファイルに rootDir がある場合、config-rootDir で rootDir が解決されること。", async () => {
    const root = await makeTempDir();
    const docsDir = path.join(root, "docs");
    await fs.ensureDir(docsDir);
    await fs.outputJson(path.join(root, "doc-repo.config.json"), { rootDir: "./docs" });

    const result = await resolveServeOptions({ cwd: root });

    expect(result.rootDir).toBe(docsDir);
    expect(result.rootSource).toBe("config-rootDir");
  });
});
