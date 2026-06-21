import { describe, expect, it } from "vitest";

import {
  beginSave,
  beginCreate,
  clearCreateFlow,
  createCreateFlowState,
  createViewerEditSessionState,
  enterEditMode,
  markCreateRejected,
  markCreateSucceeded,
  markSaveFailed,
  markSaveSucceeded,
  markSaveWarning,
  resolveSelectedIdentifierAfterDelete,
  resolveSelectedIdentifier,
  shouldPromptUnsavedChanges,
  updateUnsavedChanges,
} from "./viewerState.js";

describe("viewerState", () => {
  const documents = [{ identifier: "docs/a.md" }, { identifier: "docs/b.md" }];

  it("selects first document when no document is selected", () => {
    expect(resolveSelectedIdentifier(null, documents)).toBe("docs/a.md");
  });

  it("keeps current selection when the document still exists", () => {
    expect(resolveSelectedIdentifier("docs/b.md", documents)).toBe("docs/b.md");
  });

  it("keeps missing explicit selection so the viewer can show a recoverable 404", () => {
    expect(resolveSelectedIdentifier("docs/missing.md", documents)).toBe("docs/missing.md");
  });

  it("returns null when there are no documents", () => {
    expect(resolveSelectedIdentifier("docs/missing.md", [])).toBeNull();
  });

  it("selects first remaining document after delete when current selection is gone", () => {
    expect(resolveSelectedIdentifierAfterDelete("docs/missing.md", documents)).toBe("docs/a.md");
  });

  it("returns null after delete when no documents remain", () => {
    expect(resolveSelectedIdentifierAfterDelete("docs/missing.md", [])).toBeNull();
  });

  it("requires confirmation on document switch when editing and dirty", () => {
    const state = updateUnsavedChanges(enterEditMode(createViewerEditSessionState()), true);
    expect(shouldPromptUnsavedChanges(state, "switch-document")).toBe(true);
  });

  it("requires confirmation on edit exit when editing and dirty", () => {
    const state = updateUnsavedChanges(enterEditMode(createViewerEditSessionState()), true);
    expect(shouldPromptUnsavedChanges(state, "exit-edit")).toBe(true);
  });

  it("requires confirmation on browser leave when editing and dirty", () => {
    const state = updateUnsavedChanges(enterEditMode(createViewerEditSessionState()), true);
    expect(shouldPromptUnsavedChanges(state, "browser-leave")).toBe(true);
  });

  it("does not require confirmation when there are no unsaved edits", () => {
    const state = updateUnsavedChanges(enterEditMode(createViewerEditSessionState()), false);
    expect(shouldPromptUnsavedChanges(state, "switch-document")).toBe(false);
  });

  it("requires confirmation when creating from unsaved edit session", () => {
    const state = updateUnsavedChanges(enterEditMode(createViewerEditSessionState()), true);
    expect(shouldPromptUnsavedChanges(state, "create-document")).toBe(true);
  });

  it("tracks create flow transitions", () => {
    const initial = createCreateFlowState();
    const creating = beginCreate(initial, { nodeType: "folder", nodePath: "docs" });
    const created = markCreateSucceeded(creating);
    const rejected = markCreateRejected(created);
    const cleared = clearCreateFlow(rejected);

    expect(creating.pending).toBe(true);
    expect(created.result).toBe("created");
    expect(rejected.result).toBe("rejected");
    expect(cleared.anchor).toBeNull();
    expect(cleared.pending).toBe(false);
  });

  it("tracks save lifecycle transitions", () => {
    const initial = enterEditMode(createViewerEditSessionState());
    const saving = beginSave(initial);
    const warning = markSaveWarning(saving);
    const failed = markSaveFailed(warning);
    const saved = markSaveSucceeded(updateUnsavedChanges(failed, true));

    expect(saving.saveStatus).toBe("saving");
    expect(warning.saveStatus).toBe("warning");
    expect(failed.saveStatus).toBe("failed");
    expect(saved.saveStatus).toBe("saved");
    expect(saved.mode).toBe("view");
    expect(saved.hasUnsavedChanges).toBe(false);
  });
});
