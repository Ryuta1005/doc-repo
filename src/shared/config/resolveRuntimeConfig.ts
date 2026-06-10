import path from "node:path";
import fs from "fs-extra";

import { detectRoot } from "../../core/scanner/detectRoot.js";
import { findConfigPath } from "./findConfigPath.js";
import { validatePort, validatePathPatterns, validateRootDir } from "./validateRuntimeConfig.js";
import type { ResolvedConfig } from "../types.js";

interface RawConfigFile {
  rootDir?: unknown;
  include?: unknown;
  exclude?: unknown;
  port?: unknown;
}

interface ResolveRuntimeConfigInput {
  cwd: string;
  cliPort?: number;
}

const DEFAULT_PORT = 4000;

export const resolveRuntimeConfig = async (input: ResolveRuntimeConfigInput): Promise<ResolvedConfig> => {
  const configPath = await findConfigPath(input.cwd);

  // --- rootDir resolution ---
  let rootDir: string;
  let rootSource: ResolvedConfig["rootSource"];
  let includePatterns: string[] = [];
  let excludePatterns: string[] = [];
  let configPort: number | undefined;

  if (configPath) {
    const raw = (await fs.readJson(configPath)) as RawConfigFile;
    const configDir = path.dirname(configPath);

    includePatterns = validatePathPatterns(raw.include, "include");
    excludePatterns = validatePathPatterns(raw.exclude, "exclude");
    if (raw.port !== undefined) {
      configPort = validatePort(raw.port);
    }

    if (raw.rootDir !== undefined) {
      rootDir = await validateRootDir(raw.rootDir, configDir);
      rootSource = "config-rootDir";
    } else {
      rootDir = configDir;
      rootSource = "config-directory";
    }
  } else {
    const detected = await detectRoot(input.cwd);
    rootDir = detected.detectedRoot;
    rootSource = detected.usedFallback ? "cwd-fallback" : "git-root";
  }

  const outputDir = path.join(input.cwd, ".doc-repo");

  // --- port resolution ---
  let port: number;
  let portSource: ResolvedConfig["portSource"];

  if (input.cliPort !== undefined) {
    port = validatePort(input.cliPort);
    portSource = "cli";
  } else if (configPort !== undefined) {
    port = configPort;
    portSource = "config";
  } else {
    port = DEFAULT_PORT;
    portSource = "default";
  }

  return {
    rootDir,
    outputDir,
    includePatterns,
    excludePatterns,
    port,
    portSource,
    rootSource,
    configPath: configPath ?? null,
  };
};
