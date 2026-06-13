export type HttpErrorCode = "INVALID_REQUEST" | "DOCUMENT_NOT_FOUND" | "INTERNAL_ERROR";

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
