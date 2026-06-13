import type { HttpError, HttpErrorPayload } from "./httpErrorTypes.js";
import { createHttpError } from "./httpErrorTypes.js";
import { AppError } from "../../../shared/errors.js";

const isHttpError = (error: unknown): error is HttpError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "code" in error &&
    "message" in error &&
    typeof (error as Partial<HttpError>).status === "number" &&
    typeof (error as Partial<HttpError>).code === "string" &&
    typeof (error as Partial<HttpError>).message === "string"
  );
};

export const mapToHttpError = (error: unknown): HttpError => {
  if (isHttpError(error)) {
    return error;
  }

  if (error instanceof AppError) {
    if (error.code === "INVALID_REQUEST") {
      return createHttpError(400, "INVALID_REQUEST", error.message);
    }
    if (error.code === "DOCUMENT_NOT_FOUND") {
      return createHttpError(404, "DOCUMENT_NOT_FOUND", error.message);
    }
  }

  return createHttpError(500, "INTERNAL_ERROR", "Internal Server Error");
};

export const toHttpErrorPayload = (code: HttpErrorPayload["error"]["code"], message: string): HttpErrorPayload => {
  return { error: { code, message } };
};
