import type { DeleteDocumentRequest, DeleteDocumentTargetType } from "../../../shared/types.js";

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isTargetType = (value: unknown): value is DeleteDocumentTargetType => {
  return value === "file" || value === "folder";
};

const isInvalidPath = (value: string): boolean => {
  if (!value.trim()) {
    return true;
  }

  if (value.startsWith("/") || value.includes("\\")) {
    return true;
  }

  const segments = value.split("/");
  return segments.some((segment) => segment === ".." || segment.trim() === "");
};

export const validateDeleteDocumentRequest = (
  payload: unknown,
): { ok: true; value: DeleteDocumentRequest } | { ok: false; reason: string } => {
  if (!isPlainObject(payload)) {
    return { ok: false, reason: "request body must be a JSON object" };
  }

  const { target } = payload;
  if (!isPlainObject(target)) {
    return { ok: false, reason: "target is required" };
  }

  if (!isTargetType(target.targetType)) {
    return { ok: false, reason: "target.targetType must be file or folder" };
  }

  if (typeof target.path !== "string" || isInvalidPath(target.path)) {
    return { ok: false, reason: "target.path must be a valid relative path" };
  }

  if (typeof target.displayName !== "string" || !target.displayName.trim()) {
    return { ok: false, reason: "target.displayName is required" };
  }

  if (target.targetType === "file" && !/\.md$/i.test(target.path.trim())) {
    return { ok: false, reason: "file target.path must end with .md" };
  }

  return {
    ok: true,
    value: {
      target: {
        targetType: target.targetType,
        path: target.path,
        displayName: target.displayName,
      },
    },
  };
};
