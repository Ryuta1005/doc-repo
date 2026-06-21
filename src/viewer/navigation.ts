import { normalizeMarkdownFilenameInput, type NormalizeMarkdownFilenameResult } from "../shared/documentFilename.js";

const decodeSegmentSafe = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const encodeSegment = (value: string): string => encodeURIComponent(value);

const splitSegments = (value: string): string[] => {
  return value
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
};

export const identifierToPathname = (identifier: string): string => {
  const segments = splitSegments(identifier).map(encodeSegment);
  return `/${segments.join("/")}`;
};

export const pathnameToIdentifier = (pathname: string): string | null => {
  const directoryLike = pathname.endsWith("/");
  const trimmed = pathname.replace(/^\/+/, "");
  if (!trimmed || trimmed === "index.html") {
    return null;
  }

  const decoded = splitSegments(trimmed).map(decodeSegmentSafe).join("/");
  if (!decoded) {
    return null;
  }

  if (/\.html$/i.test(decoded)) {
    return decoded.replace(/\.html$/i, ".md");
  }

  if (/\.md$/i.test(decoded)) {
    return decoded;
  }

  if (directoryLike || !decoded.split("/").pop()?.includes(".")) {
    return `${decoded}/index.md`;
  }

  return null;
};

export const hrefToIdentifier = (href: string, baseUrl: string): string | null => {
  let url: URL;
  try {
    url = new URL(href, baseUrl);
  } catch {
    return null;
  }

  const base = new URL(baseUrl);
  if (url.origin !== base.origin) {
    return null;
  }

  return pathnameToIdentifier(url.pathname);
};

export interface DocumentSwitchAttempt {
  mode: "view" | "edit";
  hasUnsavedChanges: boolean;
  currentIdentifier: string | null;
  requestedIdentifier: string;
}

export interface DocumentSwitchDecision {
  allow: boolean;
  requireConfirmation: boolean;
  nextIdentifier: string | null;
}

export const resolveDocumentSwitchDecision = (attempt: DocumentSwitchAttempt): DocumentSwitchDecision => {
  const isSameDocument = attempt.currentIdentifier === attempt.requestedIdentifier;
  if (isSameDocument) {
    return {
      allow: true,
      requireConfirmation: false,
      nextIdentifier: attempt.currentIdentifier,
    };
  }

  if (attempt.mode === "edit" && attempt.hasUnsavedChanges) {
    return {
      allow: false,
      requireConfirmation: true,
      nextIdentifier: attempt.currentIdentifier,
    };
  }

  return {
    allow: true,
    requireConfirmation: false,
    nextIdentifier: attempt.requestedIdentifier,
  };
};

export const resolveIdentifierAfterSave = (
  savedIdentifier: string | null | undefined,
  currentIdentifier: string | null,
): string | null => {
  return savedIdentifier ?? currentIdentifier;
};

export const toSidebarLabel = (identifier: string, fallbackTitle?: string | null): string => {
  const lastSegment = identifier.split("/").pop() ?? identifier;
  const base = (fallbackTitle && fallbackTitle.trim()) || lastSegment;
  return base.replace(/\.md$/i, "");
};

export const resolveEditableDocumentIdentifier = (currentIdentifier: string, filename: string): string | null => {
  const normalized = normalizeMarkdownFilenameInput(filename);
  if (!normalized.ok) {
    return null;
  }

  const parentSegments = currentIdentifier.split("/");
  parentSegments.pop();
  const parentPath = parentSegments.filter((segment) => segment.length > 0).join("/");
  return parentPath
    ? `${parentPath}/${normalized.value.filenameWithExtension}`
    : normalized.value.filenameWithExtension;
};

export const validateEditableDocumentFilename = (filename: string): NormalizeMarkdownFilenameResult => {
  return normalizeMarkdownFilenameInput(filename);
};
