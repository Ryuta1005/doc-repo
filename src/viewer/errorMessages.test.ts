import { describe, expect, it } from "vitest";

import { formatCreateDocumentError, formatFilenameValidationReason, formatSaveDocumentError } from "./errorMessages.js";
import { CreateDocumentError, SaveDocumentError } from "./services/apiClient.js";
import { messages, type MessageKey } from "./locale/index.js";

const ja = (key: MessageKey): string => messages.ja[key] ?? messages.en[key];

describe("viewer error messages", () => {
  it("localizes create filename path separator errors with a next action", () => {
    const formatted = formatCreateDocumentError(
      new CreateDocumentError({
        code: "INVALID_INPUT",
        reason: "filename:path-separator",
        message: "filename must not include path separators",
        retryable: false,
      }),
      ja,
    );

    expect(formatted).toEqual({
      message: "ファイル名だけを入力してください。/ や \\ を使ってフォルダを指定することはできません。",
    });
  });

  it("uses the same localized message for client-side filename validation", () => {
    expect(formatFilenameValidationReason("path-separator", ja)).toEqual({
      message: "ファイル名だけを入力してください。/ や \\ を使ってフォルダを指定することはできません。",
    });
  });

  it("localizes duplicate create errors", () => {
    const formatted = formatCreateDocumentError(
      new CreateDocumentError({
        code: "ALREADY_EXISTS",
        reason: "target:already-exists",
        message: "a document with the same name already exists",
        retryable: false,
      }),
      ja,
    );

    expect(formatted).toEqual({
      message: "同じ名前の文書がすでにあります。別の名前を入力してください。",
    });
  });

  it("localizes save target errors without generic unretryable hints", () => {
    const formatted = formatSaveDocumentError(
      new SaveDocumentError({
        category: "invalid-target",
        code: "SAVE_TARGET_INVALID",
        message: "invalid target",
        retryable: false,
      }),
      ja,
    );

    expect(formatted).toEqual({
      message: "このファイル名では保存できません。ファイル名を 1 つだけ入力して、もう一度保存してください。",
    });
  });
});
