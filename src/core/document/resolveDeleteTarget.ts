import path from "node:path";
import fs from "fs-extra";

import { createDeleteDocumentError } from "../../shared/errors.js";
import type { DeleteDocumentTarget } from "../../shared/types.js";
import { evaluateDocumentTargetPolicy } from "./documentTargetPolicy.js";

export interface ResolveDeleteTargetInput {
  rootDir: string;
  target: DeleteDocumentTarget;
  includePatterns?: string[];
  excludePatterns?: string[];
}

export interface ResolvedDeleteTarget {
  targetType: "file" | "folder";
  displayName: string;
  normalizedPath: string;
  absolutePath: string;
}

export const resolveDeleteTarget = async (input: ResolveDeleteTargetInput): Promise<ResolvedDeleteTarget> => {
  const targetType = input.target.targetType;
  const rawPath = input.target.path.trim();

  if ((targetType !== "file" && targetType !== "folder") || !rawPath) {
    throw createDeleteDocumentError("invalid-target", "target is invalid", "target:invalid");
  }

  if (targetType === "file") {
    const policy = evaluateDocumentTargetPolicy({
      rootDir: input.rootDir,
      identifier: rawPath,
      includePatterns: input.includePatterns,
      excludePatterns: input.excludePatterns,
    });

    if (policy.reasons.length > 0 || !policy.normalizedIdentifier || !policy.absolutePath) {
      const outOfScope = policy.reasons.some(
        (reason) =>
          reason.includes("inside rootDir") ||
          reason.includes("outside rootDir") ||
          reason.includes("include patterns") ||
          reason.includes("exclude patterns"),
      );

      throw createDeleteDocumentError(
        outOfScope ? "out-of-scope" : "invalid-target",
        policy.reasons.join(", ") || "target is invalid",
        outOfScope ? "target:out-of-scope" : "target:invalid",
      );
    }

    const exists = await fs.pathExists(policy.absolutePath);
    if (!exists) {
      throw createDeleteDocumentError("not-found", "target file was not found", "target:not-found");
    }

    const stat = await fs.stat(policy.absolutePath);
    if (!stat.isFile()) {
      throw createDeleteDocumentError("invalid-target", "target path must be a file", "target:invalid");
    }

    return {
      targetType,
      displayName: input.target.displayName,
      normalizedPath: policy.normalizedIdentifier,
      absolutePath: policy.absolutePath,
    };
  }

  const folderPolicy = evaluateDocumentTargetPolicy({
    rootDir: input.rootDir,
    identifier: `${rawPath}/placeholder.md`,
    includePatterns: input.includePatterns,
    excludePatterns: input.excludePatterns,
  });

  const folderOutOfScope = folderPolicy.reasons.some(
    (reason) =>
      reason.includes("inside rootDir") ||
      reason.includes("outside rootDir") ||
      reason.includes("include patterns") ||
      reason.includes("exclude patterns"),
  );

  if (folderOutOfScope) {
    throw createDeleteDocumentError("out-of-scope", folderPolicy.reasons.join(", "), "target:out-of-scope");
  }

  const folderNormalized = rawPath.replace(/^\/+|\/+$/g, "");
  const folderAbsolute = folderNormalized ? path.resolve(input.rootDir, folderNormalized) : input.rootDir;
  const exists = await fs.pathExists(folderAbsolute);
  if (!exists) {
    throw createDeleteDocumentError("not-found", "target folder was not found", "target:not-found");
  }

  const stat = await fs.stat(folderAbsolute);
  if (!stat.isDirectory()) {
    throw createDeleteDocumentError("invalid-target", "target path must be a folder", "target:invalid");
  }

  return {
    targetType,
    displayName: input.target.displayName,
    normalizedPath: folderNormalized,
    absolutePath: folderAbsolute,
  };
};
