#!/usr/bin/env node
import { Command } from "commander";

import { runServe } from "../core/serve/runServe.js";
import { createConfigFile } from "../core/init/createConfigFile.js";
import { formatResultMessage } from "./formatResultMessage.js";
import { resolveServeOptions } from "./serve/resolveServeOptions.js";
import { toServeUserGuidance } from "../shared/errors.js";
import type { ServeSession, InitResult } from "../shared/types.js";

export const run = async (argv: string[] = process.argv, cwd: string = process.cwd()): Promise<void> => {
  const program = new Command();

  program.name("doc-repo").description("Serve browser workspace for repository Markdown.");

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
    .description("ブラウザワークスペースを起動する")
    .option("--port <number>", "待受ポート", (value: string) => Number.parseInt(value, 10))
    .action(async (options?: { port?: number }) => {
      let result: ServeSession;
      try {
        const config = await resolveServeOptions({ cwd, cliPort: options?.port });
        result = await runServe({
          cwd,
          rootDir: config.rootDir,
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

      process.exitCode = result.exitCode;
    });

  await program.parseAsync(argv);
};

if (process.env.VITEST !== "true") {
  void run();
}
