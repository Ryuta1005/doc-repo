export type HttpErrorCode =
  | "INVALID_REQUEST"
  | "DOCUMENT_NOT_FOUND"
  | "SAVE_TARGET_INVALID"
  | "SAVE_TARGET_UNWRITABLE"
  | "SAVE_IO_TEMPORARY"
  | "INVALID_INPUT"
  | "OUT_OF_SCOPE"
  | "ALREADY_EXISTS"
  | "UNWRITABLE_TARGET"
  | "INVALID_TARGET"
  | "NOT_FOUND"
  | "CONTAINS_UNMANAGED_CONTENT"
  | "TRANSIENT_IO"
  | "INTERNAL_ERROR";

export interface HttpErrorPayload {
  error: {
    code: HttpErrorCode;
    message: string;
  };
}

export interface HttpError extends Error {
  status: number;
  code: HttpErrorCode;
}

export const createHttpError = (status: number, code: HttpErrorCode, message: string): HttpError => {
  const error = new Error(message) as HttpError;
  error.status = status;
  error.code = code;
  return error;
};
