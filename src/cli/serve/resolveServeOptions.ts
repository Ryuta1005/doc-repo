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
  include?: unknown;
  exclude?: unknown;
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

const validatePathPatterns = (value: unknown, fieldName: "include" | "exclude"): string[] => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value) || value.some((x) => typeof x !== "string")) {
    throw createServeError("unknown", `${fieldName} は文字列配列で指定してください。`);
  }

  return value;
};

const readConfigFile = async (
  cwd: string,
): Promise<{ port?: number; includePatterns: string[]; excludePatterns: string[] }> => {
  const configPath = await findConfigPath(cwd);
  if (!configPath) {
    return { includePatterns: [], excludePatterns: [] };
  }

  const config = (await fs.readJson(configPath)) as ServeConfigFile;

  const includePatterns = validatePathPatterns(config.include, "include");
  const excludePatterns = validatePathPatterns(config.exclude, "exclude");

  if (config.port === undefined) {
    return { includePatterns, excludePatterns };
  }

  return {
    port: validatePort(config.port),
    includePatterns,
    excludePatterns,
  };
};

export const resolveServeOptions = async (input: ResolveServeOptionsInput): Promise<ServeConfiguration> => {
  const detected = await detectRoot(input.cwd);
  const rootDir = detected.detectedRoot;
  const outputDir = path.join(rootDir, ".doc-repo");

  const configFile = await readConfigFile(input.cwd);

  if (input.cliPort !== undefined) {
    return {
      port: validatePort(input.cliPort),
      portSource: "cli",
      rootDir,
      outputDir,
      includePatterns: configFile.includePatterns,
      excludePatterns: configFile.excludePatterns,
    };
  }

  const configPort = configFile.port;
  if (configPort !== undefined) {
    return {
      port: configPort,
      portSource: "config",
      rootDir,
      outputDir,
      includePatterns: configFile.includePatterns,
      excludePatterns: configFile.excludePatterns,
    };
  }

  return {
    port: 4000,
    portSource: "default",
    rootDir,
    outputDir,
    includePatterns: configFile.includePatterns,
    excludePatterns: configFile.excludePatterns,
  };
};
