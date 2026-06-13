import { describe, expect, it } from "vitest";

import { mapToHttpError, toHttpErrorPayload } from "../../src/presentation/http/errors/httpErrorMapper.js";
import { AppError } from "../../src/shared/errors.js";

describe("http error contract", () => {
  it("maps INVALID_REQUEST app errors to 400 payload contract", () => {
    const error = mapToHttpError(new AppError("invalid path", "INVALID_REQUEST", "fix path"));
    const payload = toHttpErrorPayload(error.code, error.message);

    expect(error).toMatchObject({ status: 400, code: "INVALID_REQUEST" });
    expect(payload).toEqual({ error: { code: "INVALID_REQUEST", message: "invalid path" } });
  });

  it("maps DOCUMENT_NOT_FOUND app errors to 404 payload contract", () => {
    const error = mapToHttpError(new AppError("missing document", "DOCUMENT_NOT_FOUND", "choose another"));
    const payload = toHttpErrorPayload(error.code, error.message);

    expect(error).toMatchObject({ status: 404, code: "DOCUMENT_NOT_FOUND" });
    expect(payload).toEqual({ error: { code: "DOCUMENT_NOT_FOUND", message: "missing document" } });
  });

  it("maps unknown errors to 500 payload contract without exposing internals", () => {
    const error = mapToHttpError(new Error("boom"));
    const payload = toHttpErrorPayload(error.code, error.message);

    expect(error).toMatchObject({ status: 500, code: "INTERNAL_ERROR" });
    expect(payload).toEqual({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error" } });
  });
});
