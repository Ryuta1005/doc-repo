import path from "node:path";
import fs from "fs-extra";

import { AppError } from "../errors.js";

export const validateSiteName = (value: unknown): string => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(
      "name must be a non-empty string.",
      "CONFIG_INVALID_NAME",
      "Specify the text to show in the sidebar menu as name.",
    );
  }

  return value;
};

export const validatePort = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 65535) {
    throw new AppError(
      "port must be an integer from 1 to 65535.",
      "CONFIG_INVALID_PORT",
      "Specify port as an integer from 1 to 65535.",
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
      `${fieldName} must be an array of strings.`,
      "CONFIG_INVALID_PATTERN",
      `Specify ${fieldName} as an array of strings, for example: ["docs/**"].`,
    );
  }

  return value;
};

export const validateRootDir = async (value: unknown, configDir: string): Promise<string> => {
  if (typeof value !== "string") {
    throw new AppError(
      "rootDir must be a string.",
      "CONFIG_INVALID_ROOT_DIR",
      "Specify rootDir as a string path.",
    );
  }

  const resolved = path.isAbsolute(value) ? value : path.resolve(configDir, value);

  if (!(await fs.pathExists(resolved))) {
    throw new AppError(
      `rootDir was not found: ${resolved}`,
      "CONFIG_ROOT_DIR_NOT_FOUND",
      "Specify the path to an existing directory as rootDir.",
    );
  }

  const stat = await fs.stat(resolved);
  if (!stat.isDirectory()) {
    throw new AppError(
      `rootDir is not a directory: ${resolved}`,
      "CONFIG_ROOT_DIR_NOT_DIRECTORY",
      "Specify a directory path as rootDir.",
    );
  }

  return resolved;
};
