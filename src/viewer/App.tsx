import React from "react";
import { Globe, Pencil } from "lucide-react";

import { parseEditableMarkdown } from "../core/markdown/index.js";
import {
  CreateDocumentError,
  DeleteDocumentError,
  createDocument,
  deleteDocument,
  SaveDocumentError,
  saveDocument,
} from "./services/apiClient.js";
import {
  beginSave,
  beginCreate,
  beginDelete,
  clearDeleteFlow,
  closeDeleteConfirmation,
  createViewerEditSessionState,
  createCreateFlowState,
  createDeleteFlowState,
  enterEditMode as enterEditSession,
  markDeleteRejected,
  markDeleteSucceeded,
  markCreateRejected,
  markCreateSucceeded,
  markSaveFailed,
  markSaveSucceeded,
  shouldPromptUnsavedChanges,
  type CreationAnchorContext,
  type DeleteTargetContext,
  updateUnsavedChanges,
} from "./state/viewerState.js";
import { DocumentTree } from "./components/DocumentTree.js";
import { DocumentViewer } from "./components/DocumentViewer.js";
import { ErrorBanner } from "./components/ErrorBanner.js";
import { DocumentEditor, type DocumentEditorSnapshot } from "./components/DocumentEditor.js";
import { UnsavedChangesDialog } from "./components/UnsavedChangesDialog.js";
import { DeleteConfirmationDialog } from "./components/DeleteConfirmationDialog.js";
import { useViewerState } from "./hooks/useViewerState.js";
import { useUnsavedChangesGuard } from "./hooks/useUnsavedChangesGuard.js";
import { LocaleProvider, type Locale, useLocale } from "./locale/index.js";
import {
  formatCreateDocumentError,
  formatDeleteDocumentError,
  formatFilenameValidationReason,
  formatSaveDocumentError,
} from "./errorMessages.js";
import {
  resolveDocumentSwitchDecision,
  resolveEditableDocumentIdentifier,
  resolveIdentifierAfterSave,
  validateEditableDocumentFilename,
} from "./navigation.js";

const SIDEBAR_WIDTH_STORAGE_KEY = "doc-repo.sidebarWidth";
const DEFAULT_SIDEBAR_WIDTH = 320;
const MIN_SIDEBAR_WIDTH = 240;
const MAX_SIDEBAR_WIDTH = 1000;
const SIDEBAR_KEYBOARD_STEP = 16;

const clampSidebarWidth = (width: number): number => Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width));

const resolveInitialSidebarWidth = (): number => {
  if (typeof window === "undefined") {
    return DEFAULT_SIDEBAR_WIDTH;
  }

  const storedWidth = Number(window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY));
  return Number.isFinite(storedWidth) ? clampSidebarWidth(storedWidth) : DEFAULT_SIDEBAR_WIDTH;
};

const getCreateDraftTitle = (anchor: CreationAnchorContext | null, createLabel: string): string => {
  if (!anchor) {
    return createLabel;
  }

  const basePath = anchor.nodeType === "folder" ? anchor.nodePath : anchor.nodePath.split("/").slice(0, -1).join("/");
  const normalizedBasePath = basePath === "." ? "" : basePath.replace(/\/+$/u, "");

  return normalizedBasePath ? `${normalizedBasePath}/${createLabel}` : createLabel;
};

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
    refreshDocuments,
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
  const [editorFilename, setEditorFilename] = React.useState("");
  const [editorFilenameInitial, setEditorFilenameInitial] = React.useState("");
  const [createAnchor, setCreateAnchor] = React.useState<CreationAnchorContext | null>(null);
  const [pendingSelection, setPendingSelection] = React.useState<string | null>(null);
  const [pendingCreateAnchor, setPendingCreateAnchor] = React.useState<CreationAnchorContext | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = React.useState(false);
  const [createErrorMessage, setCreateErrorMessage] = React.useState<string | null>(null);
  const [createErrorHint, setCreateErrorHint] = React.useState<string | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = React.useState<string | null>(null);
  const [deleteErrorHint, setDeleteErrorHint] = React.useState<string | null>(null);
  const [pendingDeleteTarget, setPendingDeleteTarget] = React.useState<DeleteTargetContext | null>(null);
  const [editSession, setEditSession] = React.useState(() => createViewerEditSessionState());
  const [createFlow, setCreateFlow] = React.useState(() => createCreateFlowState());
  const [deleteFlow, setDeleteFlow] = React.useState(() => createDeleteFlowState());
  const [sidebarWidth, setSidebarWidth] = React.useState(resolveInitialSidebarWidth);
  const isCreateDraft = createAnchor !== null;

  const isFilenameDirty = editorFilename.trim() !== editorFilenameInitial.trim();
  const isDirty = Boolean(editorSnapshot?.isDirty) || isFilenameDirty;
  React.useEffect(() => {
    setEditSession((current) => updateUnsavedChanges(current, isDirty));
  }, [isDirty]);

  useUnsavedChangesGuard(isDirty);

  const enterEditMode = React.useCallback(() => {
    const parsed = parseEditableMarkdown(markdown);
    const selectedName = (selectedIdentifier?.split("/").pop() ?? "").replace(/\.md$/i, "");
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
    setCreateErrorMessage(null);
    setCreateErrorHint(null);
    setCreateAnchor(null);
    setEditorFilename(selectedName);
    setEditorFilenameInitial(selectedName);
    setEditSession((current) => enterEditSession(updateUnsavedChanges(current, false)));
  }, [markdown, selectedIdentifier]);

  const openCreateDraftEditor = React.useCallback((anchor: CreationAnchorContext) => {
    const parsed = parseEditableMarkdown("");
    const snapshot: DocumentEditorSnapshot = {
      document: parsed.document,
      markdown: "",
      newlineStyle: parsed.newlineStyle,
      hasTrailingNewline: parsed.hasTrailingNewline,
      isDirty: false,
    };

    setMode("edit");
    setEditorSnapshot(snapshot);
    setEditSourceMarkdown("");
    setSaveErrorMessage(null);
    setSaveErrorHint(null);
    setCreateErrorMessage(null);
    setCreateErrorHint(null);
    setCreateAnchor(anchor);
    setEditorFilename("");
    setEditorFilenameInitial("");
    setEditSession((current) => enterEditSession(updateUnsavedChanges(current, false)));
  }, []);

  const leaveEditMode = React.useCallback(() => {
    setMode("view");
    setEditorSnapshot(null);
    setEditSourceMarkdown(null);
    setSaveErrorMessage(null);
    setSaveErrorHint(null);
    setCreateAnchor(null);
    setEditorFilename("");
    setEditorFilenameInitial("");
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
        setPendingCreateAnchor(null);
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

  const requestCreateDocument = React.useCallback(
    (anchor: CreationAnchorContext) => {
      setCreateErrorMessage(null);
      setCreateErrorHint(null);
      if (shouldPromptUnsavedChanges({ mode, hasUnsavedChanges: isDirty }, "create-document")) {
        setPendingSelection(null);
        setPendingCreateAnchor(anchor);
        setShowUnsavedDialog(true);
        return;
      }

      openCreateDraftEditor(anchor);
    },
    [isDirty, mode, openCreateDraftEditor],
  );

  const requestDeleteDocument = React.useCallback(
    (target: DeleteTargetContext) => {
      setDeleteErrorMessage(null);
      setDeleteErrorHint(null);

      if (shouldPromptUnsavedChanges({ mode, hasUnsavedChanges: isDirty }, "delete-document")) {
        setPendingSelection(null);
        setPendingCreateAnchor(null);
        setPendingDeleteTarget(target);
        setShowUnsavedDialog(true);
        return;
      }

      setDeleteFlow((current) => ({
        ...current,
        confirmTarget: target,
        menuTarget: null,
        pending: false,
        result: "idle",
      }));
    },
    [isDirty, mode],
  );

  const handleSaveRequest = React.useCallback(
    async (snapshot: DocumentEditorSnapshot) => {
      if (!selectedIdentifier && !isCreateDraft) {
        return;
      }

      setIsSaving(true);
      setSaveErrorMessage(null);
      setSaveErrorHint(null);
      setEditSession((current) => beginSave(current));

      try {
        let targetIdentifier = selectedIdentifier;
        const trimmedFilename = editorFilename.trim();

        if (isCreateDraft) {
          const anchor = createAnchor;
          if (!anchor) {
            return;
          }

          if (!trimmedFilename) {
            setCreateErrorMessage(t("createFilenameRequired"));
            setCreateErrorHint(null);
            setEditSession((current) => markSaveFailed(current));
            return;
          }

          setCreateFlow((current) => beginCreate(current, anchor));
          const createResponse = await createDocument({ anchor, filename: trimmedFilename });
          if (createResponse.status !== "created") {
            throw new CreateDocumentError({
              message: createResponse.error.message,
              code: createResponse.error.code,
              reason: createResponse.error.reason,
              retryable: createResponse.error.retryable,
            });
          }

          targetIdentifier = createResponse.document.identifier;
          setCreateFlow((current) => markCreateSucceeded(current));
          setCreateAnchor(null);
          setEditorFilename(createResponse.document.displayName);
          setEditorFilenameInitial(createResponse.document.displayName);
          await refreshDocuments();
          selectIdentifier(targetIdentifier);
        } else {
          if (!selectedIdentifier) {
            return;
          }

          const filenameValidation = validateEditableDocumentFilename(trimmedFilename);
          if (!filenameValidation.ok) {
            const formatted = formatFilenameValidationReason(filenameValidation.reason, t);
            setSaveErrorMessage(formatted.message);
            setSaveErrorHint(null);
            setEditSession((current) => markSaveFailed(current));
            return;
          }

          const editableIdentifier = resolveEditableDocumentIdentifier(selectedIdentifier, trimmedFilename);
          if (!editableIdentifier) {
            setSaveErrorMessage(t("createFilenameInvalid"));
            setSaveErrorHint(null);
            setEditSession((current) => markSaveFailed(current));
            return;
          }

          targetIdentifier = editableIdentifier;
        }

        if (!targetIdentifier) {
          return;
        }

        const response = await saveDocument({
          identifier: targetIdentifier,
          originalIdentifier: isCreateDraft ? undefined : (selectedIdentifier ?? undefined),
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

        const nextIdentifier = resolveIdentifierAfterSave(response.savedDocument.identifier, targetIdentifier);
        if (nextIdentifier && nextIdentifier !== selectedIdentifier) {
          selectIdentifier(nextIdentifier);
        }
        setEditSession((current) => markSaveSucceeded(current));
        leaveEditMode();
        reloadSelectedDocument();
      } catch (error) {
        setEditSession((current) => markSaveFailed(current));
        if (error instanceof CreateDocumentError) {
          setCreateFlow((current) => markCreateRejected(current));
          const formatted = formatCreateDocumentError(error, t);
          setCreateErrorMessage(formatted.message);
          setCreateErrorHint(formatted.hint ?? null);
        } else if (error instanceof SaveDocumentError) {
          const formatted = formatSaveDocumentError(error, t);
          setSaveErrorMessage(formatted.message);
          setSaveErrorHint(formatted.hint ?? null);
        } else {
          setSaveErrorMessage(error instanceof Error ? error.message : String(error));
          setSaveErrorHint(null);
        }
      } finally {
        setIsSaving(false);
      }
    },
    [
      createAnchor,
      editorFilename,
      isCreateDraft,
      leaveEditMode,
      refreshDocuments,
      reloadSelectedDocument,
      selectedIdentifier,
      selectIdentifier,
      t,
    ],
  );

  const handleDeleteConfirm = React.useCallback(async () => {
    const target = deleteFlow.confirmTarget;
    if (!target) {
      return;
    }

    setDeleteErrorMessage(null);
    setDeleteErrorHint(null);
    setDeleteFlow((current) => beginDelete(current));

    try {
      const response = await deleteDocument({
        target: {
          targetType: target.targetType,
          path: target.path,
          displayName: target.displayName,
        },
      });

      if (response.status !== "deleted") {
        throw new DeleteDocumentError({
          message: response.error.message,
          code: response.error.code,
          reason: response.error.reason,
          retryable: response.error.retryable,
        });
      }

      await refreshDocuments({ fallbackMissingSelection: true });
      setDeleteFlow((current) => markDeleteSucceeded(current));
    } catch (error) {
      setDeleteFlow((current) => markDeleteRejected(current));
      if (error instanceof DeleteDocumentError) {
        const formatted = formatDeleteDocumentError(error, t);
        setDeleteErrorMessage(formatted.message);
        setDeleteErrorHint(formatted.hint ?? null);
      } else {
        setDeleteErrorMessage(error instanceof Error ? error.message : String(error));
        setDeleteErrorHint(null);
      }
    }
  }, [deleteFlow.confirmTarget, refreshDocuments, t]);

  const confirmDiscard = React.useCallback(() => {
    setShowUnsavedDialog(false);
    if (pendingSelection) {
      selectIdentifier(pendingSelection);
      setPendingSelection(null);
    }

    if (pendingCreateAnchor) {
      openCreateDraftEditor(pendingCreateAnchor);
      setPendingCreateAnchor(null);
      return;
    }

    if (pendingDeleteTarget) {
      setDeleteFlow((current) => ({
        ...current,
        confirmTarget: pendingDeleteTarget,
        menuTarget: null,
        pending: false,
        result: "idle",
      }));
      setPendingDeleteTarget(null);
      return;
    }

    leaveEditMode();
  }, [
    leaveEditMode,
    openCreateDraftEditor,
    pendingCreateAnchor,
    pendingDeleteTarget,
    pendingSelection,
    selectIdentifier,
  ]);

  const continueEditing = React.useCallback(() => {
    setShowUnsavedDialog(false);
    setPendingSelection(null);
    setPendingCreateAnchor(null);
    setPendingDeleteTarget(null);
  }, []);

  const updateSidebarWidth = React.useCallback((nextWidth: number): void => {
    const clampedWidth = clampSidebarWidth(nextWidth);
    setSidebarWidth(clampedWidth);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(clampedWidth));
    }
  }, []);

  const handleSidebarResizePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>): void => {
      event.preventDefault();
      const pointerId = event.pointerId;
      const startX = event.clientX;
      const startWidth = sidebarWidth;
      const handle = event.currentTarget;
      handle.setPointerCapture(pointerId);
      document.body.classList.add("is-resizing-sidebar");

      const handlePointerMove = (moveEvent: PointerEvent): void => {
        updateSidebarWidth(startWidth + moveEvent.clientX - startX);
      };

      const handlePointerEnd = (): void => {
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerEnd);
        document.removeEventListener("pointercancel", handlePointerEnd);
        if (handle.hasPointerCapture(pointerId)) {
          handle.releasePointerCapture(pointerId);
        }
        document.body.classList.remove("is-resizing-sidebar");
      };

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerEnd);
      document.addEventListener("pointercancel", handlePointerEnd);
    },
    [sidebarWidth, updateSidebarWidth],
  );

  const handleSidebarResizeKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): void => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        updateSidebarWidth(sidebarWidth - SIDEBAR_KEYBOARD_STEP);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        updateSidebarWidth(sidebarWidth + SIDEBAR_KEYBOARD_STEP);
      } else if (event.key === "Home") {
        event.preventDefault();
        updateSidebarWidth(MIN_SIDEBAR_WIDTH);
      } else if (event.key === "End") {
        event.preventDefault();
        updateSidebarWidth(MAX_SIDEBAR_WIDTH);
      }
    },
    [sidebarWidth, updateSidebarWidth],
  );

  return (
    <main className="viewer-layout" style={{ "--viewer-sidebar-width": `${sidebarWidth}px` } as React.CSSProperties}>
      <aside className="viewer-sidebar" id="tree" aria-label={t("appDocumentSidebar")}>
        <h1 className="viewer-brand">
          <a href="/">{siteName}</a>
        </h1>
        <div className="viewer-tree-scroll">
          <DocumentTree
            items={items}
            selectedIdentifier={selectedIdentifier}
            onSelect={requestSelectIdentifier}
            onCreateRequest={requestCreateDocument}
            onDeleteRequest={requestDeleteDocument}
          />
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
      <div
        className="viewer-sidebar-resizer"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize document sidebar"
        aria-valuemin={MIN_SIDEBAR_WIDTH}
        aria-valuemax={MAX_SIDEBAR_WIDTH}
        aria-valuenow={sidebarWidth}
        tabIndex={0}
        onPointerDown={handleSidebarResizePointerDown}
        onKeyDown={handleSidebarResizeKeyDown}
      />
      <section className="viewer-content">
        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
        {statusMessage ? <p className="viewer-muted">{statusMessage}</p> : null}
        {saveErrorMessage ? <ErrorBanner message={saveErrorMessage} hint={saveErrorHint ?? undefined} /> : null}
        {createErrorMessage ? <ErrorBanner message={createErrorMessage} hint={createErrorHint ?? undefined} /> : null}
        {deleteErrorMessage ? <ErrorBanner message={deleteErrorMessage} hint={deleteErrorHint ?? undefined} /> : null}
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
          <section className="viewer-shell viewer-shell-editor">
            <div className="viewer-shell-header">
              <h2 className="viewer-shell-title">
                {isCreateDraft ? getCreateDraftTitle(createAnchor, t("appCreateDocument")) : selectedIdentifier}
              </h2>
            </div>
            {editorSnapshot && editSourceMarkdown !== null ? (
              <DocumentEditor
                key={
                  isCreateDraft
                    ? `create:${createAnchor.nodeType}:${createAnchor.nodePath}`
                    : `edit:${selectedIdentifier}`
                }
                documentIdentifier={selectedIdentifier ?? ""}
                filename={editorFilename}
                filenamePlaceholder={t("editorFilenamePlaceholder")}
                filenameReadOnly={false}
                onFilenameChange={setEditorFilename}
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
        onContinueEditing={continueEditing}
        onDiscardChanges={confirmDiscard}
      />
      <DeleteConfirmationDialog
        open={Boolean(deleteFlow.confirmTarget)}
        targetName={deleteFlow.confirmTarget?.displayName ?? ""}
        pending={deleteFlow.pending}
        onCancel={() => {
          setDeleteFlow((current) => closeDeleteConfirmation(current));
        }}
        onConfirm={() => {
          void handleDeleteConfirm();
        }}
      />
    </main>
  );
}
