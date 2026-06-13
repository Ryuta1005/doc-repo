import React from "react";

import { DocumentTree } from "./components/DocumentTree.js";
import { DocumentViewer } from "./components/DocumentViewer.js";
import { ErrorBanner } from "./components/ErrorBanner.js";
import { useViewerState } from "./hooks/useViewerState.js";

export function App(): JSX.Element {
  const { items, siteName, selectedIdentifier, selectIdentifier, html, statusMessage, errorMessage } = useViewerState();

  return (
    <main className="viewer-layout">
      <aside className="viewer-sidebar" id="tree" aria-label="Document sidebar">
        <h1 className="viewer-brand">
          <a href="/">{siteName}</a>
        </h1>
        <DocumentTree items={items} selectedIdentifier={selectedIdentifier} onSelect={selectIdentifier} />
      </aside>
      <section className="viewer-content">
        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
        {statusMessage ? <p className="viewer-muted">{statusMessage}</p> : null}
        <DocumentViewer identifier={selectedIdentifier} html={html} onNavigate={selectIdentifier} />
      </section>
    </main>
  );
}
