import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import net from "node:net";
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

interface RunningCommand {
  getOutput: () => string;
  waitForTextSince: (text: string, cursor: number, timeoutMs?: number) => Promise<void>;
  stop: () => Promise<CommandResult>;
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

const startCommand = (command: string, args: string[], cwd: string): RunningCommand => {
  const { VITEST, ...baseEnv } = process.env;
  const env = { ...baseEnv, FORCE_COLOR: "0" };

  const child = spawn(command, args, {
    cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  let closedCode: number | null = null;
  let closeResolved = false;
  let closeResolve: ((result: CommandResult) => void) | undefined;
  const waiters = new Set<() => void>();

  const notifyWaiters = (): void => {
    for (const wake of waiters) {
      wake();
    }
  };

  const closePromise = new Promise<CommandResult>((resolve) => {
    closeResolve = resolve;
  });

  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
    notifyWaiters();
  });

  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
    notifyWaiters();
  });

  child.on("close", (code) => {
    closedCode = code;
    notifyWaiters();
    if (!closeResolved && closeResolve) {
      closeResolved = true;
      closeResolve({ code, stdout, stderr });
    }
  });

  const waitForTextSince = async (text: string, cursor: number, timeoutMs = 30_000): Promise<void> => {
    const started = Date.now();

    while (Date.now() - started < timeoutMs) {
      const output = `${stdout}\n${stderr}`;
      if (output.indexOf(text, cursor) >= 0) {
        return;
      }

      if (closedCode !== null) {
        break;
      }

      await new Promise<void>((resolve) => {
        const onWake = (): void => {
          waiters.delete(onWake);
          resolve();
        };
        waiters.add(onWake);
      });
    }

    throw new Error(`Timed out waiting for text: ${text}`);
  };

  return {
    getOutput: () => `${stdout}\n${stderr}`,
    waitForTextSince,
    stop: async () => {
      if (closedCode === null) {
        child.kill("SIGINT");
      }
      return await closePromise;
    },
  };
};

const findFreePort = async (): Promise<number> => {
  return await new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("failed to resolve free port"));
        return;
      }

      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
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
      await withConfigBackup(async () => {
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

  describe("watch 回帰", () => {
    it("change/add/unlink で変更検知と再生成成功ログが出ること。", async () => {
      await withConfigBackup(async () => {
        await withOutputBackup(async () => {
          const fixtureRoot = await makeTempDir();
          await fs.outputFile(path.join(fixtureRoot, "README.md"), "# README\n\ninitial");

          const port = await findFreePort();
          await fs.outputJson(path.join(repoRoot, "doc-repo.config.json"), {
            rootDir: fixtureRoot,
            port,
          });

          const running = startCommand("npm", ["run", "dev", "--", "serve"], repoRoot);

          try {
            await running.waitForTextSince("[doc-repo] watch: started", 0);

            let cursor = running.getOutput().length;
            await fs.appendFile(path.join(fixtureRoot, "README.md"), "\nchanged");
            await running.waitForTextSince("[CHANGE_DETECTED] type=change", cursor);
            await running.waitForTextSince("[REGEN_SUCCEEDED] regenerate succeeded", cursor);

            cursor = running.getOutput().length;
            const addedPath = path.join(fixtureRoot, "docs", "added.md");
            await fs.outputFile(addedPath, "# Added\n\nnew file");
            await running.waitForTextSince("[CHANGE_DETECTED] type=add", cursor);
            await running.waitForTextSince("[REGEN_SUCCEEDED] regenerate succeeded", cursor);

            cursor = running.getOutput().length;
            await fs.remove(addedPath);
            await running.waitForTextSince("[CHANGE_DETECTED] type=unlink", cursor);
            await running.waitForTextSince("[REGEN_SUCCEEDED] regenerate succeeded", cursor);
          } finally {
            await running.stop();
          }
        });
      });
    }, 90_000);
  });
});
