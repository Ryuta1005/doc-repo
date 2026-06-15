import { describe, expect, it } from "vitest";

import {
  beginSave,
  createViewerEditSessionState,
  enterEditMode,
  markSaveFailed,
  markSaveSucceeded,
  markSaveWarning,
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
