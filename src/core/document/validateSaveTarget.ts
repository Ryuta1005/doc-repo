import path from "node:path";

import micromatch from "micromatch";

import { normalizeDocumentIdentifier } from "../../shared/documentIdentifier.js";
import type { SaveValidationResult } from "../../shared/types.js";

export interface ValidateSaveTargetInput {
  rootDir: string;
  identifier: string;
  includePatterns?: string[];
  excludePatterns?: string[];
}

export interface ValidateSaveTargetOutcome extends SaveValidationResult {
  normalizedIdentifier: string | null;
  absolutePath?: string;
}

const toPosix = (value: string): string => value.split(path.sep).join(path.posix.sep);

const matchesAny = (value: string, patterns: string[]): boolean => {
  return patterns.some((pattern) => micromatch.isMatch(value, pattern, { dot: true }));
};

export const validateSaveTarget = (input: ValidateSaveTargetInput): ValidateSaveTargetOutcome => {
  const reasons: string[] = [];
  const warningMessages: string[] = [];

  const trimmedIdentifier = input.identifier.trim();
  if (!trimmedIdentifier) {
    reasons.push("identifier must not be empty");
    return { isValidTarget: false, reasons, warningMessages, normalizedIdentifier: null };
  }

  if (path.isAbsolute(trimmedIdentifier)) {
    reasons.push("identifier must be relative to rootDir");
  }

  const normalized = normalizeDocumentIdentifier(trimmedIdentifier);
  if (normalized.startsWith("../") || normalized === "..") {
    reasons.push("identifier must remain inside rootDir");
  }

  if (!/\.md$/i.test(normalized)) {
    reasons.push("identifier must end with .md");
  }

  const normalizedRelative = toPosix(normalized);
  if (
    input.includePatterns &&
    input.includePatterns.length > 0 &&
    !matchesAny(normalizedRelative, input.includePatterns)
  ) {
    reasons.push("identifier does not match include patterns");
  }

  if (
    input.excludePatterns &&
    input.excludePatterns.length > 0 &&
    matchesAny(normalizedRelative, input.excludePatterns)
  ) {
    reasons.push("identifier matches exclude patterns");
  }

  const absolutePath = path.resolve(input.rootDir, normalizedRelative);
  const relative = path.relative(input.rootDir, absolutePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    reasons.push("identifier resolves outside rootDir");
  }

  return {
    isValidTarget: reasons.length === 0,
    reasons,
    warningMessages,
    normalizedIdentifier: reasons.length === 0 ? normalizedRelative : null,
    absolutePath: reasons.length === 0 ? absolutePath : undefined,
  };
};
