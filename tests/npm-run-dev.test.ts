import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";

const thisFile = fileURLToPath(import.meta.url);
const testsDir = path.dirname(thisFile);
const repoRoot = path.resolve(testsDir, "..");
const outputDir = path.join(repoRoot, ".doc-repo");

const tempDirs: string[] = [];

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

const runCommandUntilOutput = async (
  command: string,
  args: string[],
  cwd: string,
  expectedText: string,
): Promise<CommandResult> => {
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
    let closed = false;

    const finalize = (code: number | null): void => {
      if (closed) {
        return;
      }
      closed = true;
      resolve({ code, stdout, stderr });
    };

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      if (stdout.includes(expectedText) || stderr.includes(expectedText)) {
        child.kill("SIGINT");
      }
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      if (stdout.includes(expectedText) || stderr.includes(expectedText)) {
        child.kill("SIGINT");
      }
    });

    child.on("close", (code) => {
      finalize(code);
    });
  });
};

const makeTempDir = async (): Promise<string> => {
  const base = path.join(repoRoot, "tests", ".tmp");
  await fs.ensureDir(base);
  const dir = await fs.mkdtemp(path.join(base, "doc-repo-it-dev-"));
  tempDirs.push(dir);
  return dir;
};

const withOutputBackup = async (testBody: () => Promise<void>): Promise<void> => {
  const backupDir = `${outputDir}.__it_backup__`;

  await fs.remove(backupDir);
  if (await fs.pathExists(outputDir)) {
    await fs.move(outputDir, backupDir, { overwrite: true });
  }

  try {
    await testBody();
  } finally {
    await fs.remove(outputDir);
    if (await fs.pathExists(backupDir)) {
      await fs.move(backupDir, outputDir, { overwrite: true });
    }
  }
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
  await fs.remove(path.join(repoRoot, "doc-repo.config.json.__it_backup__"));
  await fs.remove(path.join(repoRoot, "doc-repo.config.json"));
});

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

describe("npm run dev", () => {
  describe("正常系", () => {
    it("Markdown が 1 件以上ある場合、exit code 0 で .doc-repo/index.html が生成されること。", async () => {
      await withOutputBackup(async () => {
        const fixtureRoot = await makeTempDir();
        const scopeDir = path.join(fixtureRoot, "with-md");
        await fs.outputFile(path.join(scopeDir, "guide.md"), "# Guide");

        const relativeScope = path.relative(repoRoot, scopeDir).split(path.sep).join("/");
        const result = await runCommand("npm", ["run", "dev", "--", relativeScope], repoRoot);

        expect(result.code).toBe(0);
        expect(`${result.stdout}\n${result.stderr}`).toContain("ドキュメントサイトの生成に成功しました。");
        expect(await fs.pathExists(path.join(outputDir, "index.html"))).toBe(true);
      });
    }, 60_000);
  });

  describe("準正常系", () => {
    it("Markdown が 0 件の場合、exit code 0 かつ警告付きで成功すること。", async () => {
      await withOutputBackup(async () => {
        const fixtureRoot = await makeTempDir();
        const scopeDir = path.join(fixtureRoot, "empty");
        await fs.ensureDir(scopeDir);

        const relativeScope = path.relative(repoRoot, scopeDir).split(path.sep).join("/");
        const result = await runCommand("npm", ["run", "dev", "--", relativeScope], repoRoot);

        expect(result.code).toBe(0);
        expect(`${result.stdout}\n${result.stderr}`).toContain(
          "Markdown ファイルが 0 件でした。空サイトを生成しました。",
        );
      });
    }, 60_000);
  });

  describe("異常系", () => {
    it("scopePath がリポジトリ外を指す場合、exit code 1 で失敗すること。", async () => {
      await withOutputBackup(async () => {
        const result = await runCommand("npm", ["run", "dev", "--", "../"], repoRoot);

        expect(result.code).toBe(1);
        expect(result.stderr).toContain("SCOPE_OUTSIDE_ROOT");
      });
    }, 60_000);

    it("指定したスコープが存在しない場合、exit code 1 で失敗すること。", async () => {
      await withOutputBackup(async () => {
        const result = await runCommand("npm", ["run", "dev", "--", "nonexistent-folder"], repoRoot);

        expect(result.code).toBe(1);
        expect(result.stderr).toContain("SCOPE_NOT_FOUND");
      });
    }, 60_000);

    it("スコープがファイルを指す場合、exit code 1 で失敗すること。", async () => {
      await withOutputBackup(async () => {
        const fixtureRoot = await makeTempDir();
        const file = path.join(fixtureRoot, "test.txt");
        await fs.outputFile(file, "content");

        const relativeFile = path.relative(repoRoot, file).split(path.sep).join("/");
        const result = await runCommand("npm", ["run", "dev", "--", relativeFile], repoRoot);

        expect(result.code).toBe(1);
        expect(result.stderr).toContain("SCOPE_NOT_DIRECTORY");
        expect(result.stderr).toContain(relativeFile);
      });
    }, 60_000);
  });

  describe("serve 設定適用", () => {
    it("設定ファイルの port が serve 起動 URL に反映されること。", async () => {
      await withConfigBackup(async () => {
        await fs.outputJson(path.join(repoRoot, "doc-repo.config.json"), { port: 4200 });
        const result = await runCommandUntilOutput(
          "npm",
          ["run", "dev", "--", "serve"],
          repoRoot,
          "http://localhost:4200",
        );

        expect(`${result.stdout}\n${result.stderr}`).toContain("http://localhost:4200");
      });
    }, 60_000);
  });
});
