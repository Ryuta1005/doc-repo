import path from "node:path";
import fs from "fs-extra";

import { AppError } from "../errors.js";

export const validatePort = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 65535) {
    throw new AppError(
      "port は 1-65535 の整数である必要があります。",
      "CONFIG_INVALID_PORT",
      "port は 1 から 65535 の整数で指定してください。",
    );
  }

  return value;
};

export const validatePathPatterns = (value: unknown, fieldName: "include" | "exclude"): string[] => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value) || value.some((x) => typeof x !== "string")) {
    throw new AppError(
      `${fieldName} は文字列配列で指定してください。`,
      "CONFIG_INVALID_PATTERN",
      `${fieldName} には文字列の配列を指定してください。例: ["docs/**"]`,
    );
  }

  return value;
};

export const validateRootDir = async (value: unknown, configDir: string): Promise<string> => {
  if (typeof value !== "string") {
    throw new AppError(
      "rootDir は文字列で指定してください。",
      "CONFIG_INVALID_ROOT_DIR",
      "rootDir には文字列（パス）を指定してください。",
    );
  }

  const resolved = path.isAbsolute(value) ? value : path.resolve(configDir, value);

  if (!(await fs.pathExists(resolved))) {
    throw new AppError(
      `rootDir が見つかりません: ${resolved}`,
      "CONFIG_ROOT_DIR_NOT_FOUND",
      "rootDir に存在するディレクトリのパスを指定してください。",
    );
  }

  const stat = await fs.stat(resolved);
  if (!stat.isDirectory()) {
    throw new AppError(
      `rootDir はディレクトリではありません: ${resolved}`,
      "CONFIG_ROOT_DIR_NOT_DIRECTORY",
      "rootDir にはディレクトリのパスを指定してください。",
    );
  }

  return resolved;
};
