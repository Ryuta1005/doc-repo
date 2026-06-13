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

const withConfigBackup = async (testBody: () => Promise<void>): Promise<void> => {
  const configPath = path.join(repoRoot, "doc-repo.config.json");
  const backupPath = `${configPath}.__it_backup__`;

  if (await fs.pathExists(configPath)) {
    await fs.move(configPath, backupPath, { overwrite: true });
  }

  try {
    await testBody();
  } finally {
    await fs.remove(configPath);
    if (await fs.pathExists(backupPath)) {
      await fs.move(backupPath, configPath, { overwrite: true });
    }
  }
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

  describe("静的生成回帰", () => {
    it("doc-repo [scopePath] の成果物がオフライン参照可能な相対資産パスを維持すること。", async () => {
      await withConfigBackup(async () => {
        const fixturesBase = path.join(repoRoot, "tests", ".tmp");
        await fs.ensureDir(fixturesBase);
        const fixtureRoot = await fs.mkdtemp(path.join(fixturesBase, "doc-repo-static-output-"));

        try {
          await fs.outputFile(path.join(fixtureRoot, "README.md"), "# README\\n\\nhello");
          await fs.outputFile(path.join(fixtureRoot, "docs", "guide.md"), "# Guide\\n\\nguide");
          await fs.outputJson(path.join(repoRoot, "doc-repo.config.json"), { rootDir: fixtureRoot });

          const rebuild = await runCommand("npm", ["run", "build"], repoRoot);
          expect(rebuild.code).toBe(0);

          const cliPath = path.join(repoRoot, "dist", "cli", "index.js");
          const cliResult = await runCommand("node", [cliPath], repoRoot);
          expect(cliResult.code).toBe(0);

          const nestedPage = await fs.readFile(path.join(fixtureRoot, ".doc-repo", "docs", "guide.html"), "utf8");
          expect(nestedPage).toContain('href="../styles.css"');
          expect(nestedPage).toContain('src="../app.js"');

          expect(await fs.pathExists(path.join(fixtureRoot, ".doc-repo", "index.html"))).toBe(true);
          expect(await fs.pathExists(path.join(fixtureRoot, ".doc-repo", "README.html"))).toBe(true);
          expect(await fs.pathExists(path.join(fixtureRoot, ".doc-repo", "docs", "guide.html"))).toBe(true);
        } finally {
          await fs.remove(fixtureRoot);
        }
      });
    }, 60_000);
  });
});
