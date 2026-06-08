import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

import { resolveServeOptions } from "./resolveServeOptions.js";

const tempDirs: string[] = [];

const makeTempDir = async (): Promise<string> => {
  const base = path.join(process.cwd(), "tests", ".tmp");
  await fs.ensureDir(base);
  const dir = await fs.mkdtemp(path.join(base, "resolve-serve-options-"));
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
  });

  it("設定ファイルに port がある場合、config が採用されること。", async () => {
    const root = await makeTempDir();
    await fs.outputJson(path.join(root, "doc-repo.config.json"), { port: 4200 });

    const result = await resolveServeOptions({ cwd: root });

    expect(result.port).toBe(4200);
    expect(result.portSource).toBe("config");
  });

  it("CLI と設定ファイルの両方に指定がない場合、default=4000 になること。", async () => {
    const root = await makeTempDir();

    const result = await resolveServeOptions({ cwd: root });

    expect(result.port).toBe(4000);
    expect(result.portSource).toBe("default");
  });

  it("port が非整数の場合、invalid-port で失敗すること。", async () => {
    const root = await makeTempDir();
    await fs.outputJson(path.join(root, "doc-repo.config.json"), { port: "abc" });

    await expect(resolveServeOptions({ cwd: root })).rejects.toMatchObject({
      code: "INVALID_PORT",
    });
  });

  it("port が範囲外の場合、invalid-port で失敗すること。", async () => {
    const root = await makeTempDir();

    await expect(resolveServeOptions({ cwd: root, cliPort: 70000 })).rejects.toMatchObject({
      code: "INVALID_PORT",
    });
  });
});
