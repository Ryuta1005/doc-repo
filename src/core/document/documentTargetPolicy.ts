import path from "node:path";

import micromatch from "micromatch";

import { normalizeDocumentIdentifier } from "../../shared/documentIdentifier.js";

export interface DocumentTargetPolicyInput {
  rootDir: string;
  identifier: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  requireMarkdownExtension?: boolean;
}

export interface DocumentTargetPolicyResult {
  reasons: string[];
  normalizedIdentifier: string | null;
  absolutePath?: string;
}

export const toPosixPath = (value: string): string => value.split(path.sep).join(path.posix.sep);

export const matchesAnyDocumentPattern = (value: string, patterns: string[]): boolean => {
  return patterns.some((pattern) => micromatch.isMatch(value, pattern, { dot: true }));
};

export const evaluateDocumentTargetPolicy = (input: DocumentTargetPolicyInput): DocumentTargetPolicyResult => {
  const reasons: string[] = [];
  const trimmedIdentifier = input.identifier.trim();

  if (!trimmedIdentifier) {
    reasons.push("identifier must not be empty");
    return { reasons, normalizedIdentifier: null };
  }

  if (path.isAbsolute(trimmedIdentifier)) {
    reasons.push("identifier must be relative to rootDir");
  }

  const normalized = normalizeDocumentIdentifier(trimmedIdentifier);
  if (normalized.startsWith("../") || normalized === "..") {
    reasons.push("identifier must remain inside rootDir");
  }

  if (input.requireMarkdownExtension !== false && !/\.md$/i.test(normalized)) {
    reasons.push("identifier must end with .md");
  }

  const normalizedRelative = toPosixPath(normalized);
  if (
    input.includePatterns &&
    input.includePatterns.length > 0 &&
    !matchesAnyDocumentPattern(normalizedRelative, input.includePatterns)
  ) {
    reasons.push("identifier does not match include patterns");
  }

  if (
    input.excludePatterns &&
    input.excludePatterns.length > 0 &&
    matchesAnyDocumentPattern(normalizedRelative, input.excludePatterns)
  ) {
    reasons.push("identifier matches exclude patterns");
  }

  const absolutePath = path.resolve(input.rootDir, normalizedRelative);
  const relative = path.relative(input.rootDir, absolutePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    reasons.push("identifier resolves outside rootDir");
  }

  return {
    reasons,
    normalizedIdentifier: reasons.length === 0 ? normalizedRelative : null,
    absolutePath: reasons.length === 0 ? absolutePath : undefined,
  };
};
