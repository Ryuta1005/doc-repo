import React from "react";
import { Globe, Pencil } from "lucide-react";

import { parseEditableMarkdown } from "../core/markdown/index.js";
import { SaveDocumentError, saveDocument } from "./services/apiClient.js";
import {
  beginSave,
  createViewerEditSessionState,
  enterEditMode as enterEditSession,
  markSaveFailed,
  markSaveSucceeded,
  shouldPromptUnsavedChanges,
  updateUnsavedChanges,
} from "./state/viewerState.js";
import { DocumentTree } from "./components/DocumentTree.js";
import { DocumentViewer } from "./components/DocumentViewer.js";
import { ErrorBanner } from "./components/ErrorBanner.js";
import { DocumentEditor, type DocumentEditorSnapshot } from "./components/DocumentEditor.js";
import { UnsavedChangesDialog } from "./components/UnsavedChangesDialog.js";
import { useViewerState } from "./hooks/useViewerState.js";
import { useUnsavedChangesGuard } from "./hooks/useUnsavedChangesGuard.js";
import { LocaleProvider, type Locale, useLocale } from "./locale/index.js";
import { resolveDocumentSwitchDecision, resolveIdentifierAfterSave } from "./navigation.js";

export function App(): React.JSX.Element {
  return (
    <LocaleProvider>
      <AppContent />
    </LocaleProvider>
  );
}

function AppContent(): React.JSX.Element {
  const { locale, setLocale, t } = useLocale();
  const {
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
  } = useViewerState();
  const [mode, setMode] = React.useState<"view" | "edit">("view");
  const [editorSnapshot, setEditorSnapshot] = React.useState<DocumentEditorSnapshot | null>(null);
  const [editSourceMarkdown, setEditSourceMarkdown] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = React.useState<string | null>(null);
  const [saveErrorHint, setSaveErrorHint] = React.useState<string | null>(null);
  const [pendingSelection, setPendingSelection] = React.useState<string | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = React.useState(false);
  const [editSession, setEditSession] = React.useState(() => createViewerEditSessionState());

  const isDirty = Boolean(editorSnapshot?.isDirty);
  React.useEffect(() => {
    setEditSession((current) => updateUnsavedChanges(current, isDirty));
  }, [isDirty]);

  useUnsavedChangesGuard(isDirty);

  const enterEditMode = React.useCallback(() => {
    const parsed = parseEditableMarkdown(markdown);
    const snapshot: DocumentEditorSnapshot = {
      document: parsed.document,
      markdown,
      newlineStyle: parsed.newlineStyle,
      hasTrailingNewline: parsed.hasTrailingNewline,
      isDirty: false,
    };
    setEditSourceMarkdown(markdown);
    setEditorSnapshot(snapshot);
    setMode("edit");
    setSaveErrorMessage(null);
    setEditSession((current) => enterEditSession(updateUnsavedChanges(current, false)));
  }, [markdown]);

  const leaveEditMode = React.useCallback(() => {
    setMode("view");
    setEditorSnapshot(null);
    setEditSourceMarkdown(null);
    setSaveErrorMessage(null);
    setSaveErrorHint(null);
    setEditSession((current) => ({ ...current, mode: "view", hasUnsavedChanges: false, saveStatus: "idle" }));
  }, []);

  const requestSelectIdentifier = React.useCallback(
    (identifier: string) => {
      const decision = resolveDocumentSwitchDecision({
        mode,
        hasUnsavedChanges: isDirty,
        currentIdentifier: selectedIdentifier,
        requestedIdentifier: identifier,
      });

      if (decision.requireConfirmation) {
        setPendingSelection(identifier);
        setShowUnsavedDialog(true);
        return;
      }

      if (!decision.allow) {
        return;
      }

      selectIdentifier(identifier);
      if (mode === "edit") {
        leaveEditMode();
      }
    },
    [isDirty, leaveEditMode, mode, selectedIdentifier, selectIdentifier],
  );

  const handleSaveRequest = React.useCallback(
    async (snapshot: DocumentEditorSnapshot) => {
      if (!selectedIdentifier) {
        return;
      }

      setIsSaving(true);
      setSaveErrorMessage(null);
      setSaveErrorHint(null);
      setEditSession((current) => beginSave(current));

      try {
        const response = await saveDocument({
          identifier: selectedIdentifier,
          markdownContent: snapshot.markdown,
          options: {
            newlineStyle: snapshot.newlineStyle,
            hasTrailingNewline: snapshot.hasTrailingNewline,
          },
          proceed: true,
        });

        if (response.status !== "saved") {
          throw new Error(t("appSaveFailed"));
        }

        const nextIdentifier = resolveIdentifierAfterSave(response.savedDocument.identifier, selectedIdentifier);
        if (nextIdentifier && nextIdentifier !== selectedIdentifier) {
          selectIdentifier(nextIdentifier);
        }
        setEditSession((current) => markSaveSucceeded(current));
        leaveEditMode();
        reloadSelectedDocument();
      } catch (error) {
        setEditSession((current) => markSaveFailed(current));
        if (error instanceof SaveDocumentError) {
          setSaveErrorMessage(error.message);
          setSaveErrorHint(
            error.retryable ? t("appRetryableSaveHint") : t("appUnretryableSaveHint"),
          );
        } else {
          setSaveErrorMessage(error instanceof Error ? error.message : String(error));
          setSaveErrorHint(null);
        }
      } finally {
        setIsSaving(false);
      }
    },
    [leaveEditMode, reloadSelectedDocument, selectedIdentifier, t],
  );

  const confirmDiscard = React.useCallback(() => {
    setShowUnsavedDialog(false);
    if (pendingSelection) {
      selectIdentifier(pendingSelection);
      setPendingSelection(null);
    }
    leaveEditMode();
  }, [leaveEditMode, pendingSelection, selectIdentifier]);

  const continueEditing = React.useCallback(() => {
    setShowUnsavedDialog(false);
    setPendingSelection(null);
  }, []);

  return (
    <main className="viewer-layout">
      <aside className="viewer-sidebar" id="tree" aria-label={t("appDocumentSidebar")}>
        <h1 className="viewer-brand">
          <a href="/">{siteName}</a>
        </h1>
        <div className="viewer-tree-scroll">
          <DocumentTree items={items} selectedIdentifier={selectedIdentifier} onSelect={requestSelectIdentifier} />
        </div>
        <label className="viewer-locale-switcher">
          <Globe size={16} aria-hidden="true" />
          <select
            aria-label={t("displayLanguage")}
            value={locale}
            onChange={(event) => {
              setLocale(event.target.value as Locale);
            }}
          >
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </label>
      </aside>
      <section className="viewer-content">
        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
        {statusMessage ? <p className="viewer-muted">{statusMessage}</p> : null}
        {saveErrorMessage ? <ErrorBanner message={saveErrorMessage} hint={saveErrorHint ?? undefined} /> : null}
        {mode === "view" ? (
          <section className="viewer-shell">
            <div className="viewer-shell-header">
              <h2 className="viewer-shell-title">{selectedIdentifier}</h2>
              <button type="button" className="btn btn-primary" onClick={enterEditMode} disabled={!selectedIdentifier}>
                <Pencil size={18} />
                {t("appEditDocument")}
              </button>
            </div>
            <DocumentViewer identifier={selectedIdentifier} html={html} onNavigate={requestSelectIdentifier} />
          </section>
        ) : (
          <section className="viewer-shell">
            <div className="viewer-shell-header">
              <h2 className="viewer-shell-title">{selectedIdentifier}</h2>
            </div>
            {editorSnapshot && editSourceMarkdown !== null ? (
              <DocumentEditor
                documentIdentifier={selectedIdentifier ?? ""}
                sourceMarkdown={editSourceMarkdown}
                onSnapshotChange={setEditorSnapshot}
                onSaveRequest={handleSaveRequest}
                onCancelRequest={() => {
                  if (shouldPromptUnsavedChanges({ mode, hasUnsavedChanges: isDirty }, "exit-edit")) {
                    setShowUnsavedDialog(true);
                    return;
                  }
                  leaveEditMode();
                }}
                isSaving={isSaving}
              />
            ) : null}
          </section>
        )}
      </section>
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        triggerLabel={pendingSelection ? t("appSwitchDocument") : t("appExitEdit")}
        onContinueEditing={continueEditing}
        onDiscardChanges={confirmDiscard}
      />
    </main>
  );
}
