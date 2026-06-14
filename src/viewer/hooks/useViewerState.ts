import React from "react";

import { fetchDocument, fetchDocuments, fetchSiteConfig } from "../services/apiClient.js";
import { pathnameToIdentifier, identifierToPathname } from "../navigation.js";
import { startSseClient } from "../services/sseClient.js";
import { resolveSelectedIdentifier } from "../state/viewerState.js";
import { useLocale } from "../locale/index.js";

interface DocumentTreeItem {
  identifier: string;
  title: string;
}

interface ViewerState {
  items: DocumentTreeItem[];
  siteName: string;
  selectedIdentifier: string | null;
  selectIdentifier: (identifier: string) => void;
  reloadSelectedDocument: () => void;
  title: string;
  markdown: string;
  html: string;
  statusMessage: string;
  errorMessage: string | null;
}

export const useViewerState = (): ViewerState => {
  const { t } = useLocale();
  const initialIdentifier = React.useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return pathnameToIdentifier(window.location.pathname);
  }, []);

  const [items, setItems] = React.useState<DocumentTreeItem[]>([]);
  const [siteName, setSiteName] = React.useState<string>("Doc Repo");
  const [selectedIdentifier, setSelectedIdentifier] = React.useState<string | null>(initialIdentifier);
  const [title, setTitle] = React.useState<string>(() => t("loading"));
  const [markdown, setMarkdown] = React.useState<string>("");
  const [html, setHtml] = React.useState<string>("");
  const [statusMessage, setStatusMessage] = React.useState<string>(() => t("loading"));
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const selectedIdentifierRef = React.useRef<string | null>(initialIdentifier);

  React.useEffect(() => {
    selectedIdentifierRef.current = selectedIdentifier;
  }, [selectedIdentifier]);

  const loadDocuments = React.useCallback(async () => {
    try {
      const docs = await fetchDocuments();
      const nextItems = docs.map((doc) => ({ identifier: doc.identifier, title: doc.title }));
      setItems(nextItems);
      setErrorMessage(null);

      const currentSelected = selectedIdentifierRef.current;
      const nextSelected = resolveSelectedIdentifier(currentSelected, docs);
      if (nextSelected !== currentSelected) {
        selectedIdentifierRef.current = nextSelected;
        setSelectedIdentifier(nextSelected);
        if (nextSelected && typeof window !== "undefined") {
          window.history.replaceState({}, "", identifierToPathname(nextSelected));
        }
      }

      if (!docs.length) {
        setStatusMessage(t("noDocumentsStatus"));
        setTitle("No documents");
        setHtml(`<p>${t("markdownNotFound")}</p>`);
      } else {
        setStatusMessage("");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setStatusMessage(t("documentsListLoadFailed"));
    }
  }, [t]);

  const loadSiteConfig = React.useCallback(async () => {
    try {
      const config = await fetchSiteConfig();
      setSiteName(config.name || "Doc Repo");
    } catch {
      setSiteName("Doc Repo");
    }
  }, []);

  const loadDocumentByIdentifier = React.useCallback(async (identifier: string | null) => {
    if (!identifier) {
      return;
    }

    try {
      const detail = await fetchDocument(identifier);
      setTitle(detail.title);
      setMarkdown(detail.markdown);
      setHtml(detail.html);
      setErrorMessage(null);
      setStatusMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setStatusMessage(t("documentLoadFailed"));
      setTitle("Not Found");
      setHtml(`<h1>Not Found</h1><p>${t("documentNotFound")}</p><p><a href="/">${t("backToTop")}</a></p>`);
    }
  }, [t]);

  const loadSelectedDocument = React.useCallback(async () => {
    await loadDocumentByIdentifier(selectedIdentifierRef.current);
  }, [loadDocumentByIdentifier]);

  const reloadSelectedDocument = React.useCallback(() => {
    void loadSelectedDocument();
  }, [loadSelectedDocument]);

  React.useEffect(() => {
    void loadSiteConfig();
    void loadDocuments();
  }, [loadDocuments, loadSiteConfig]);

  React.useEffect(() => {
    void loadDocumentByIdentifier(selectedIdentifier);
  }, [loadDocumentByIdentifier, selectedIdentifier]);

  React.useEffect(() => {
    const isActivePage = (): boolean =>
      typeof document === "undefined" || (document.visibilityState !== "hidden" && document.hasFocus());
    let handle: ReturnType<typeof startSseClient> | null = null;

    const closeSse = (): void => {
      handle?.close();
      handle = null;
    };

    const openSse = (): void => {
      if (handle || !isActivePage()) {
        return;
      }

      handle = startSseClient({
        onReload: () => {
          void loadDocuments();
          void loadSelectedDocument();
        },
        onError: () => {
          setStatusMessage(t("reconnecting"));
        },
      });
    };

    const handlePageActivationChange = (): void => {
      if (!isActivePage()) {
        closeSse();
        return;
      }

      openSse();
      void loadDocuments();
      void loadSelectedDocument();
    };

    const handlePageBlur = (): void => {
      closeSse();
    };

    openSse();
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handlePageActivationChange);
      window.addEventListener("focus", handlePageActivationChange);
      window.addEventListener("blur", handlePageBlur);
    }

    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handlePageActivationChange);
        window.removeEventListener("focus", handlePageActivationChange);
        window.removeEventListener("blur", handlePageBlur);
      }
      closeSse();
    };
  }, [loadDocuments, loadSelectedDocument, t]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const onPopState = (): void => {
      setSelectedIdentifier(pathnameToIdentifier(window.location.pathname));
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  const selectIdentifier = React.useCallback((identifier: string) => {
    setSelectedIdentifier(identifier);
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", identifierToPathname(identifier));
    }
  }, []);

  return {
    items,
    siteName,
    selectedIdentifier,
    selectIdentifier,
    reloadSelectedDocument,
    title,
    markdown,
    html,
    statusMessage,
    errorMessage,
  };
};
