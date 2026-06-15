import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

import { createConfigFile } from "./createConfigFile.js";

const tempPaths: string[] = [];

const makeTempDir = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "doc-repo-init-test-"));
  tempPaths.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(tempPaths.splice(0).map((p) => fs.remove(p)));
});

describe("createConfigFile", () => {
  it("設定ファイルが存在しない場合に作成されること。", async () => {
    const cwd = await makeTempDir();

    const result = await createConfigFile(cwd);
    const configPath = path.join(cwd, "doc-repo.config.json");

    expect(result).toEqual({
      status: "created",
      configPath,
    });

    const actual = await fs.readJson(configPath);
    expect(actual).toEqual({
      name: "Doc Repo",
      rootDir: ".",
      include: ["**/*.md"],
      exclude: [],
      port: 4000,
    });
  });

  it("設定ファイルが既に存在する場合は上書きしないこと。", async () => {
    const cwd = await makeTempDir();
    const configPath = path.join(cwd, "doc-repo.config.json");
    const original = {
      rootDir: "./docs",
      include: ["specs/**/*.md"],
      exclude: ["drafts/**"],
      port: 4100,
    };
    await fs.writeJson(configPath, original, { spaces: 2 });

    const result = await createConfigFile(cwd);

    expect(result).toEqual({
      status: "already-exists",
      configPath,
    });

    const actual = await fs.readJson(configPath);
    expect(actual).toEqual(original);
  });

  it("書き込みに失敗した場合は failure と理由を返すこと。", async () => {
    const cwd = await makeTempDir();
    const notDir = path.join(cwd, "not-directory");
    await fs.outputFile(notDir, "x");

    const result = await createConfigFile(notDir);

    expect(result.status).toBe("failure");
    expect(result.errorReason).toBeDefined();
    expect(result.configPath).toBe(path.join(notDir, "doc-repo.config.json"));
  });
});
