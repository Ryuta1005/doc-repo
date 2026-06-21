import type { CreateDocumentError, SaveDocumentError } from "./services/apiClient.js";
import type { MessageKey } from "./locale/index.js";
import type { FilenameValidationReason } from "../shared/documentFilename.js";

type Translate = (key: MessageKey) => string;

export interface ViewerErrorMessage {
  message: string;
  hint?: string;
}

export const formatFilenameValidationReason = (
  reason: FilenameValidationReason,
  t: Translate,
): ViewerErrorMessage => {
  if (reason === "path-separator") {
    return { message: t("createFilenamePathSeparator") };
  }
  if (reason === "path-segment") {
    return { message: t("createFilenamePathSegment") };
  }
  if (reason === "empty-display-name") {
    return { message: t("createFilenameEmptyAfterMd") };
  }

  return { message: t("createFilenameRequired") };
};

export const formatCreateDocumentError = (error: CreateDocumentError, t: Translate): ViewerErrorMessage => {
  if (error.reason === "filename:path-separator") {
    return formatFilenameValidationReason("path-separator", t);
  }
  if (error.reason === "filename:path-segment") {
    return formatFilenameValidationReason("path-segment", t);
  }
  if (error.reason === "filename:empty-display-name") {
    return formatFilenameValidationReason("empty-display-name", t);
  }
  if (error.reason === "filename:required") {
    return formatFilenameValidationReason("required", t);
  }
  if (error.reason === "filename:invalid") {
    return { message: t("createFilenameInvalid") };
  }

  if (error.reason === "target:already-exists") {
    return { message: t("createAlreadyExists") };
  }

  if (error.reason === "target:out-of-scope") {
    return { message: t("createOutOfScope") };
  }

  if (error.reason === "target:unavailable") {
    return { message: t("createAnchorUnavailable") };
  }

  return {
    message: t("createTemporaryFailure"),
    hint: t("appRetryableSaveHint"),
  };
};

export const formatSaveDocumentError = (error: SaveDocumentError, t: Translate): ViewerErrorMessage => {
  if (error.code === "SAVE_TARGET_INVALID") {
    return { message: t("saveTargetInvalid") };
  }

  if (error.code === "SAVE_TARGET_UNWRITABLE") {
    return { message: t("saveTargetUnavailable") };
  }

  return {
    message: t("saveTemporaryFailure"),
    hint: t("appRetryableSaveHint"),
  };
};
