#!/usr/bin/env node
import { createRequire } from "node:module";

import { Command } from "commander";

import { runServe } from "../core/serve/runServe.js";
import { createConfigFile } from "../core/init/createConfigFile.js";
import { formatResultMessage } from "./formatResultMessage.js";
import { resolveServeOptions } from "./serve/resolveServeOptions.js";
import { toServeUserGuidance } from "../shared/errors.js";
import type { ServeSession, InitResult } from "../shared/types.js";

const DEFAULT_COMMAND = "serve";
const require = createRequire(import.meta.url);
const packageJson = require("../../package.json") as { version: string };

const shouldUseDefaultServeCommand = (argv: string[]): boolean => argv.length <= 2;

export const run = async (argv: string[] = process.argv, cwd: string = process.cwd()): Promise<void> => {
  const program = new Command();

  program.name("doc-repo").description("Serve browser workspace for repository Markdown.").version(packageJson.version);

  program
    .command("init")
    .description("Create a doc-repo.config.json template")
    .action(async () => {
      const result: InitResult = await createConfigFile(cwd);

      if (result.status === "created") {
        console.log(`Created config file: ${result.configPath}`);
        process.exitCode = 0;
        return;
      }

      if (result.status === "already-exists") {
        console.log(`Config file already exists: ${result.configPath}`);
        process.exitCode = 0;
        return;
      }

      console.error("Error: Failed to create config file.");
      if (result.errorReason) {
        console.error(`Reason: ${result.errorReason}`);
      }
      process.exitCode = 1;
    });

  program
    .command("serve")
    .description("Start the browser workspace")
    .option("--port <number>", "Listening port", (value: string) => Number.parseInt(value, 10))
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

  const normalizedArgv = shouldUseDefaultServeCommand(argv) ? [...argv, DEFAULT_COMMAND] : argv;
  await program.parseAsync(normalizedArgv);
};

if (process.env.VITEST !== "true") {
  void run();
}
