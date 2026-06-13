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
