import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "fs-extra";
import { describe, expect, it } from "vitest";

const thisFile = fileURLToPath(import.meta.url);
const testsDir = path.dirname(thisFile);
const repoRoot = path.resolve(testsDir, "..");

interface CommandResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

const runCommand = async (command: string, args: string[], cwd: string): Promise<CommandResult> => {
  return await new Promise((resolve) => {
    const { VITEST, ...baseEnv } = process.env;
    const env = { ...baseEnv, FORCE_COLOR: "0" };

    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
};

describe("npm run build", () => {
  describe("正常系", () => {
    it("TypeScript ビルドを実行した場合、exit code 0 で dist/cli/index.js が生成されること。", async () => {
      const result = await runCommand("npm", ["run", "build"], repoRoot);

      expect(result.code).toBe(0);
      expect(await fs.pathExists(path.join(repoRoot, "dist", "cli", "index.js"))).toBe(true);
    }, 60_000);
  });

  describe("準正常系", () => {
    it("ビルド済み状態で再実行した場合でも、exit code 0 が返却されること。", async () => {
      const result = await runCommand("npm", ["run", "build"], repoRoot);

      expect(result.code).toBe(0);
    }, 60_000);
  });

  describe("異常系", () => {
    it("存在しない project を指定した場合、exit code 0 以外で終了すること。", async () => {
      const result = await runCommand("npm", ["run", "build", "--", "--project", "./__missing__.json"], repoRoot);

      expect(result.code).not.toBe(0);
      expect(`${result.stdout}\n${result.stderr}`).toContain("__missing__.json");
    }, 60_000);
  });
});
