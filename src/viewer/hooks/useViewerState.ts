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

  const loadDocuments = React.useCallback(async () => {
    try {
      const docs = await fetchDocuments();
      const nextItems = docs.map((doc) => ({ identifier: doc.identifier, title: doc.title }));
      setItems(nextItems);
      setErrorMessage(null);

      const nextSelected = resolveSelectedIdentifier(selectedIdentifier, docs);
      if (nextSelected !== selectedIdentifier) {
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
  }, [selectedIdentifier, t]);

  const loadSiteConfig = React.useCallback(async () => {
    try {
      const config = await fetchSiteConfig();
      setSiteName(config.name || "Doc Repo");
    } catch {
      setSiteName("Doc Repo");
    }
  }, []);

  const loadSelectedDocument = React.useCallback(async () => {
    if (!selectedIdentifier) {
      return;
    }

    try {
      const detail = await fetchDocument(selectedIdentifier);
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
  }, [selectedIdentifier, t]);

  const reloadSelectedDocument = React.useCallback(() => {
    void loadSelectedDocument();
  }, [loadSelectedDocument]);

  React.useEffect(() => {
    void loadSiteConfig();
    void loadDocuments();
  }, [loadDocuments, loadSiteConfig]);

  React.useEffect(() => {
    void loadSelectedDocument();
  }, [loadSelectedDocument]);

  React.useEffect(() => {
    const handle = startSseClient({
      onReload: () => {
        void loadDocuments();
        void loadSelectedDocument();
      },
      onError: () => {
        setStatusMessage(t("reconnecting"));
      },
    });

    return () => {
      handle.close();
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
