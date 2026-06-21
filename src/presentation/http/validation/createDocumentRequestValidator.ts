import type { CreateAnchorNodeType, CreateDocumentRequest } from "../../../shared/types.js";

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isAnchorNodeType = (value: unknown): value is CreateAnchorNodeType => {
  return value === "file" || value === "folder";
};

export const validateCreateDocumentRequest = (
  payload: unknown,
): { ok: true; value: CreateDocumentRequest } | { ok: false; reason: string } => {
  if (!isPlainObject(payload)) {
    return { ok: false, reason: "request body must be a JSON object" };
  }

  const { anchor, filename } = payload;

  if (!isPlainObject(anchor)) {
    return { ok: false, reason: "anchor is required" };
  }

  if (!isAnchorNodeType(anchor.nodeType)) {
    return { ok: false, reason: "anchor.nodeType must be file or folder" };
  }

  if (typeof anchor.nodePath !== "string" || !anchor.nodePath.trim()) {
    return { ok: false, reason: "anchor.nodePath is required" };
  }

  if (typeof filename !== "string" || !filename.trim()) {
    return { ok: false, reason: "filename is required" };
  }

  return {
    ok: true,
    value: {
      anchor: {
        nodeType: anchor.nodeType,
        nodePath: anchor.nodePath,
      },
      filename,
    },
  };
};
