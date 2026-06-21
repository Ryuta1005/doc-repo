import path from "node:path";

import fs from "fs-extra";

import { normalizeDocumentIdentifier } from "../../shared/documentIdentifier.js";
import { normalizeMarkdownFilenameInput, type FilenameValidationReason } from "../../shared/documentFilename.js";
import { createCreateDocumentError } from "../../shared/errors.js";
import type { CreateDocumentAnchor } from "../../shared/types.js";
import { evaluateDocumentTargetPolicy, toPosixPath } from "./documentTargetPolicy.js";

export interface ResolveCreateTargetInput {
  rootDir: string;
  anchor: CreateDocumentAnchor;
  filename: string;
  includePatterns?: string[];
  excludePatterns?: string[];
}

export interface ResolveCreateTargetResult {
  targetAbsolutePath: string;
  targetIdentifier: string;
  filenameWithExtension: string;
  displayName: string;
}

const filenameValidationMessages: Record<FilenameValidationReason, string> = {
  required: "filename is required",
  "path-segment": "filename must not be a path segment",
  "path-separator": "filename must not include path separators",
  "empty-display-name": "filename must include at least one non-extension character",
};

const filenameValidationReasons: Record<FilenameValidationReason, `filename:${FilenameValidationReason}`> = {
  required: "filename:required",
  "path-segment": "filename:path-segment",
  "path-separator": "filename:path-separator",
  "empty-display-name": "filename:empty-display-name",
};

const normalizeFilename = (filename: string): { filenameWithExtension: string; displayName: string } => {
  const normalized = normalizeMarkdownFilenameInput(filename);
  if (!normalized.ok) {
    throw createCreateDocumentError(
      "invalid-input",
      filenameValidationMessages[normalized.reason],
      filenameValidationReasons[normalized.reason],
    );
  }

  return normalized.value;
};

const resolveAnchorAbsolutePath = (rootDir: string, anchor: CreateDocumentAnchor): string => {
  const normalizedNodePath = normalizeDocumentIdentifier(anchor.nodePath.trim());

  if (
    !normalizedNodePath ||
    path.isAbsolute(normalizedNodePath) ||
    normalizedNodePath.startsWith("../") ||
    normalizedNodePath === ".."
  ) {
    throw createCreateDocumentError(
      "out-of-scope",
      "anchor.nodePath must be a relative path inside rootDir",
      "target:out-of-scope",
    );
  }

  const anchorAbsolutePath = path.resolve(rootDir, toPosixPath(normalizedNodePath));
  const relativeToRoot = path.relative(rootDir, anchorAbsolutePath);
  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    throw createCreateDocumentError("out-of-scope", "anchor resolves outside rootDir", "target:out-of-scope");
  }

  return anchorAbsolutePath;
};

export const resolveCreateTarget = async (input: ResolveCreateTargetInput): Promise<ResolveCreateTargetResult> => {
  const { filenameWithExtension, displayName } = normalizeFilename(input.filename);
  const anchorAbsolutePath = resolveAnchorAbsolutePath(input.rootDir, input.anchor);

  const anchorExists = await fs.pathExists(anchorAbsolutePath);
  if (!anchorExists) {
    throw createCreateDocumentError("unwritable-target", "anchor target does not exist", "target:unavailable");
  }

  const anchorStat = await fs.stat(anchorAbsolutePath);
  if (input.anchor.nodeType === "folder" && !anchorStat.isDirectory()) {
    throw createCreateDocumentError("invalid-input", "folder anchor must point to a directory", "filename:invalid");
  }
  if (input.anchor.nodeType === "file" && !anchorStat.isFile()) {
    throw createCreateDocumentError("invalid-input", "file anchor must point to a file", "filename:invalid");
  }

  const basePath = input.anchor.nodeType === "folder" ? anchorAbsolutePath : path.dirname(anchorAbsolutePath);
  const targetAbsolutePath = path.resolve(basePath, filenameWithExtension);
  const relativeToRoot = path.relative(input.rootDir, targetAbsolutePath);
  const policy = evaluateDocumentTargetPolicy({
    rootDir: input.rootDir,
    identifier: relativeToRoot,
    includePatterns: input.includePatterns,
    excludePatterns: input.excludePatterns,
  });
  if (policy.reasons.length > 0 || !policy.normalizedIdentifier) {
    throw createCreateDocumentError("out-of-scope", policy.reasons.join(", "), "target:out-of-scope");
  }

  return {
    targetAbsolutePath,
    targetIdentifier: policy.normalizedIdentifier,
    filenameWithExtension,
    displayName,
  };
};
