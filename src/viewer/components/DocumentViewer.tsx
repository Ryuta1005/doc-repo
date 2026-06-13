import React from "react";
import { hrefToIdentifier, identifierToPathname } from "../navigation.js";

interface DocumentViewerProps {
  identifier: string | null;
  html: string;
  onNavigate: (identifier: string) => void;
}

const EXTERNAL_OR_HASH = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

const toDocumentHtmlPath = (identifier: string): string => {
  return identifierToPathname(identifier.replace(/\.md$/i, ".html"));
};

const normalizeHtmlForViewer = (html: string, identifier: string | null): string => {
  if (!identifier || typeof document === "undefined") {
    return html;
  }

  const template = document.createElement("template");
  template.innerHTML = html;
  const baseUrl = new URL(toDocumentHtmlPath(identifier), window.location.origin);

  template.content.querySelectorAll<HTMLElement>("img[src],a[href]").forEach((element) => {
    const attrName = element.tagName.toLowerCase() === "img" ? "src" : "href";
    const raw = element.getAttribute(attrName);
    if (!raw || EXTERNAL_OR_HASH.test(raw)) {
      return;
    }

    try {
      const resolved = new URL(raw, baseUrl);
      element.setAttribute(attrName, `${resolved.pathname}${resolved.search}${resolved.hash}`);
    } catch {
      // Keep original URL when it cannot be parsed.
    }
  });

  return template.innerHTML;
};

export function DocumentViewer({ identifier, html, onNavigate }: DocumentViewerProps): JSX.Element {
  const normalizedHtml = React.useMemo(() => normalizeHtmlForViewer(html, identifier), [html, identifier]);
  const articleRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const root = articleRef.current;
    if (!root) {
      return;
    }

    const onClick = (event: MouseEvent): void => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || EXTERNAL_OR_HASH.test(href)) {
        return;
      }

      const nextIdentifier = hrefToIdentifier(href, window.location.href);
      if (!nextIdentifier) {
        return;
      }

      event.preventDefault();
      onNavigate(nextIdentifier);
    };

    root.addEventListener("click", onClick);
    return () => {
      root.removeEventListener("click", onClick);
    };
  }, [onNavigate]);

  return (
    <article className="viewer-article" id="article" ref={articleRef}>
      <section dangerouslySetInnerHTML={{ __html: normalizedHtml }} />
    </article>
  );
}
