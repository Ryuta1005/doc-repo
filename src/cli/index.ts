#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { Command } from "commander";

import { generateSite } from "../core/site/generateSite.js";
import { runServe } from "../core/serve/runServe.js";
import { createConfigFile } from "../core/init/createConfigFile.js";
import { formatResultMessage } from "./formatResultMessage.js";
import { resolveExitCode } from "./exitCode.js";
import { resolveServeOptions } from "./serve/resolveServeOptions.js";
import { resolveRuntimeConfig } from "../shared/config/resolveRuntimeConfig.js";
import { AppError, toUserGuidance, toServeUserGuidance } from "../shared/errors.js";
import type { GenerationResult, ServeSession, InitResult } from "../shared/types.js";

const openFile = (filePath: string): void => {
  if (process.platform === "win32") {
    const child = spawn("cmd", ["/c", "start", "", filePath], { detached: true, stdio: "ignore" });
    child.unref();
    return;
  }

  const cmd = process.platform === "darwin" ? "open" : "xdg-open";
  const child = spawn(cmd, [filePath], { detached: true, stdio: "ignore" });
  child.unref();
};

export const run = async (argv: string[] = process.argv, cwd: string = process.cwd()): Promise<void> => {
  const program = new Command();

  program
    .name("doc-repo")
    .description("Generate a static documentation site from Markdown files.")
    .argument("[scopePath]", "Repository-relative directory to generate")
    .option("--open", "生成後にブラウザで index.html を開く")
    .action(async (scopePath?: string, options?: { open?: boolean }) => {
      let result: GenerationResult;
      try {
        const config = await resolveRuntimeConfig({ cwd });
        result = await generateSite({
          cwd,
          scopePath,
          siteName: config.siteName,
          resolvedRootDir: config.rootDir,
          includePatterns: config.includePatterns,
          excludePatterns: config.excludePatterns,
        });
      } catch (error) {
        const guidance = toUserGuidance(error);
        result = {
          status: "failure",
          exitCode: 1,
          outputDir: "",
          targetPath: "",
          markdownFileCount: 0,
          message: "設定ファイルの読み込みに失敗しました。",
          warnings: [],
          errorReason: guidance.reason,
          hint: guidance.hint,
        };
      }
      const message = formatResultMessage(result);

      if (result.status === "failure") {
        console.error(message);
      } else {
        console.log(message);
        if (options?.open) {
          openFile(path.join(result.outputDir, "index.html"));
        }
      }

      process.exitCode = resolveExitCode(result);
    });

  program
    .command("init")
    .description("doc-repo.config.json の雛形を生成する")
    .action(async () => {
      const result: InitResult = await createConfigFile(cwd);

      if (result.status === "created") {
        console.log(`設定ファイルを作成しました: ${result.configPath}`);
        process.exitCode = 0;
        return;
      }

      if (result.status === "already-exists") {
        console.log(`設定ファイルは既に存在します: ${result.configPath}`);
        process.exitCode = 0;
        return;
      }

      console.error("エラー: 設定ファイルの作成に失敗しました。");
      if (result.errorReason) {
        console.error(`理由: ${result.errorReason}`);
      }
      process.exitCode = 1;
    });

  program
    .command("serve")
    .description("生成済みサイトをローカルサーバーで起動する")
    .option("--port <number>", "待受ポート", (value: string) => Number.parseInt(value, 10))
    .action(async (options?: { port?: number }) => {
      let result: ServeSession;
      try {
        const config = await resolveServeOptions({ cwd, cliPort: options?.port });
        result = await runServe({
          cwd,
          rootDir: config.rootDir,
          outputDir: config.outputDir,
          siteName: config.siteName,
          port: config.port,
          includePatterns: config.includePatterns,
          excludePatterns: config.excludePatterns,
        });
      } catch (error) {
        const guidance = toServeUserGuidance(error);
        result = {
          status: "failed",
          exitCode: 1,
          steps: [],
          failures: [
            {
              type: guidance.type,
              message: guidance.reason,
              hint: guidance.hint,
              field: guidance.field,
              exitCode: 1,
            },
          ],
        };
      }
      const message = formatResultMessage(result);

      if (result.status === "failed") {
        console.error(message);
      } else {
        console.log(message);
      }

      process.exitCode = resolveExitCode(result);
    });

  await program.parseAsync(argv);
};

if (process.env.VITEST !== "true") {
  void run();
}
