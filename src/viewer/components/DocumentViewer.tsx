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

const createAdmonitionIconSvg = (type: string): string => {
  const common =
    'width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

  if (type === "note") {
    return `<svg ${common}><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>`;
  }

  if (type === "tip") {
    return `<svg ${common}><path d="M15 14c.2-.4.5-.8.8-1.1A4.7 4.7 0 0 0 18 9.5 6 6 0 0 0 6 9.5c0 1.3.5 2.5 1.4 3.4.3.3.6.7.8 1.1"></path><path d="M9 18h6"></path><path d="M10 22h4"></path></svg>`;
  }

  if (type === "important") {
    return `<svg ${common}><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>`;
  }

  if (type === "warning") {
    return `<svg ${common}><path d="m10.3 3.9-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>`;
  }

  return `<svg ${common}><path d="M20 13c0 5-3.5 7-8 9-4.5-2-8-4-8-9V6l8-3 8 3z"></path></svg>`;
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

  template.content.querySelectorAll<HTMLElement>("blockquote").forEach((blockquote) => {
    const firstParagraph = blockquote.querySelector("p");
    if (!firstParagraph) {
      return;
    }

    const match = firstParagraph.innerHTML.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i);
    if (!match) {
      return;
    }

    const type = match[1].toLowerCase();
    firstParagraph.innerHTML = firstParagraph.innerHTML.replace(
      /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i,
      "",
    );
    if (firstParagraph.textContent?.trim().length === 0) {
      firstParagraph.remove();
    }

    blockquote.classList.add("viewer-admonition", `viewer-admonition--${type}`);

    const title = document.createElement("p");
    title.className = "viewer-admonition-title";
    const icon = document.createElement("span");
    icon.className = "viewer-admonition-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = createAdmonitionIconSvg(type);

    const label = document.createElement("span");
    label.textContent = type.charAt(0).toUpperCase() + type.slice(1);

    title.append(icon, label);
    blockquote.prepend(title);
  });

  return template.innerHTML;
};

export function DocumentViewer({ identifier, html, onNavigate }: DocumentViewerProps): React.JSX.Element {
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
