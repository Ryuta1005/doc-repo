import React from "react";

import { fetchDocument, fetchDocuments, fetchSiteConfig } from "../services/apiClient.js";
import { pathnameToIdentifier, identifierToPathname } from "../navigation.js";
import { startSseClient } from "../services/sseClient.js";
import { resolveSelectedIdentifier } from "../state/viewerState.js";

interface DocumentTreeItem {
  identifier: string;
  title: string;
}

interface ViewerState {
  items: DocumentTreeItem[];
  siteName: string;
  selectedIdentifier: string | null;
  selectIdentifier: (identifier: string) => void;
  title: string;
  html: string;
  statusMessage: string;
  errorMessage: string | null;
}

export const useViewerState = (): ViewerState => {
  const initialIdentifier = React.useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return pathnameToIdentifier(window.location.pathname);
  }, []);

  const [items, setItems] = React.useState<DocumentTreeItem[]>([]);
  const [siteName, setSiteName] = React.useState<string>("Doc Repo");
  const [selectedIdentifier, setSelectedIdentifier] = React.useState<string | null>(initialIdentifier);
  const [title, setTitle] = React.useState<string>("Loading...");
  const [html, setHtml] = React.useState<string>("");
  const [statusMessage, setStatusMessage] = React.useState<string>("読み込み中...");
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
        setStatusMessage("表示できるドキュメントがありません。");
        setTitle("No documents");
        setHtml("<p>Markdown が見つかりませんでした。</p>");
      } else {
        setStatusMessage("");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setStatusMessage("ドキュメント一覧の取得に失敗しました。");
    }
  }, [selectedIdentifier]);

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
      setHtml(detail.html);
      setErrorMessage(null);
      setStatusMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setStatusMessage("文書の取得に失敗しました。");
      setTitle("Not Found");
      setHtml('<h1>Not Found</h1><p>文書が見つかりませんでした。</p><p><a href="/">トップへ戻る</a></p>');
    }
  }, [selectedIdentifier]);

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
        setStatusMessage("自動更新の接続が一時的に不安定です。再接続を試行しています...");
      },
    });

    return () => {
      handle.close();
    };
  }, [loadDocuments, loadSelectedDocument]);

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
    title,
    html,
    statusMessage,
    errorMessage,
  };
};
