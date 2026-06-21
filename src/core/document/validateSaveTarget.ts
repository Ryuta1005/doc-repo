import type { SaveValidationResult } from "../../shared/types.js";
import { evaluateDocumentTargetPolicy } from "./documentTargetPolicy.js";

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

export const validateSaveTarget = (input: ValidateSaveTargetInput): ValidateSaveTargetOutcome => {
  const warningMessages: string[] = [];
  const policy = evaluateDocumentTargetPolicy({
    rootDir: input.rootDir,
    identifier: input.identifier,
    includePatterns: input.includePatterns,
    excludePatterns: input.excludePatterns,
  });

  return {
    isValidTarget: policy.reasons.length === 0,
    reasons: policy.reasons,
    warningMessages,
    normalizedIdentifier: policy.normalizedIdentifier,
    absolutePath: policy.absolutePath,
  };
};
