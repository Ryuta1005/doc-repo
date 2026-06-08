import path from "node:path";
import fs from "fs-extra";

import { detectRoot } from "../../core/scanner/detectRoot.js";
import { createServeError } from "../../shared/errors.js";
import type { ServeConfiguration } from "../../shared/types.js";

interface ResolveServeOptionsInput {
  cwd: string;
  cliPort?: number;
}

interface ServeConfigFile {
  port?: unknown;
}

const findConfigPath = async (startDir: string): Promise<string | undefined> => {
  let current = path.resolve(startDir);

  while (true) {
    const configPath = path.join(current, "doc-repo.config.json");
    if (await fs.pathExists(configPath)) {
      return configPath;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return undefined;
    }

    current = parent;
  }
};

const validatePort = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 65535) {
    throw createServeError("invalid-port", "port は 1-65535 の整数である必要があります。");
  }

  return value;
};

const readConfigPort = async (cwd: string): Promise<number | undefined> => {
  const configPath = await findConfigPath(cwd);
  if (!configPath) {
    return undefined;
  }

  const config = (await fs.readJson(configPath)) as ServeConfigFile;
  if (config.port === undefined) {
    return undefined;
  }

  return validatePort(config.port);
};

export const resolveServeOptions = async (input: ResolveServeOptionsInput): Promise<ServeConfiguration> => {
  const detected = await detectRoot(input.cwd);
  const rootDir = detected.detectedRoot;
  const outputDir = path.join(rootDir, ".doc-repo");

  if (input.cliPort !== undefined) {
    return {
      port: validatePort(input.cliPort),
      portSource: "cli",
      rootDir,
      outputDir,
    };
  }

  const configPort = await readConfigPort(input.cwd);
  if (configPort !== undefined) {
    return {
      port: configPort,
      portSource: "config",
      rootDir,
      outputDir,
    };
  }

  return {
    port: 4000,
    portSource: "default",
    rootDir,
    outputDir,
  };
};
