#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { Command } from "commander";

import { generateSite } from "../core/site/generateSite.js";
import { runServe } from "../core/serve/runServe.js";
import { formatResultMessage } from "./formatResultMessage.js";
import { resolveExitCode } from "./exitCode.js";
import { resolveServeOptions } from "./serve/resolveServeOptions.js";

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
      const result = await generateSite({ cwd, scopePath });
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
    .command("serve")
    .description("生成済みサイトをローカルサーバーで起動する")
    .option("--port <number>", "待受ポート", (value: string) => Number.parseInt(value, 10))
    .action(async (options?: { port?: number }) => {
      const config = await resolveServeOptions({ cwd, cliPort: options?.port });
      const result = await runServe({
        cwd,
        rootDir: config.rootDir,
        outputDir: config.outputDir,
        port: config.port,
        includePatterns: config.includePatterns,
        excludePatterns: config.excludePatterns,
      });
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
