export interface ViewerDocumentSummary {
  identifier: string;
}

export type ViewerMode = "view" | "edit";

export type SaveLifecycleStatus = "idle" | "saving" | "warning" | "saved" | "failed";

export type UnsavedChangesTrigger =
  | "switch-document"
  | "exit-edit"
  | "browser-leave"
  | "create-document"
  | "delete-document";

export interface DeleteTargetContext {
  targetType: "file" | "folder";
  path: string;
  displayName: string;
}

export interface DeleteFlowState {
  menuTarget: DeleteTargetContext | null;
  confirmTarget: DeleteTargetContext | null;
  pending: boolean;
  result: "idle" | "deleted" | "rejected";
}

export const createDeleteFlowState = (): DeleteFlowState => ({
  menuTarget: null,
  confirmTarget: null,
  pending: false,
  result: "idle",
});

export const openDeleteMenu = (state: DeleteFlowState, target: DeleteTargetContext): DeleteFlowState => ({
  ...state,
  menuTarget: target,
  result: "idle",
});

export const closeDeleteMenu = (state: DeleteFlowState): DeleteFlowState => ({
  ...state,
  menuTarget: null,
});

export const openDeleteConfirmation = (state: DeleteFlowState, target: DeleteTargetContext): DeleteFlowState => ({
  ...state,
  confirmTarget: target,
  menuTarget: null,
  pending: false,
  result: "idle",
});

export const closeDeleteConfirmation = (state: DeleteFlowState): DeleteFlowState => ({
  ...state,
  confirmTarget: null,
  pending: false,
});

export const beginDelete = (state: DeleteFlowState): DeleteFlowState => ({
  ...state,
  pending: true,
  result: "idle",
});

export const markDeleteSucceeded = (state: DeleteFlowState): DeleteFlowState => ({
  ...state,
  pending: false,
  result: "deleted",
  confirmTarget: null,
  menuTarget: null,
});

export const markDeleteRejected = (state: DeleteFlowState): DeleteFlowState => ({
  ...state,
  pending: false,
  result: "rejected",
});

export const clearDeleteFlow = (state: DeleteFlowState): DeleteFlowState => ({
  ...state,
  menuTarget: null,
  confirmTarget: null,
  pending: false,
  result: "idle",
});

export interface CreationAnchorContext {
  nodeType: "file" | "folder";
  nodePath: string;
}

export interface CreateFlowState {
  anchor: CreationAnchorContext | null;
  pending: boolean;
  result: "idle" | "created" | "rejected";
}

export const createCreateFlowState = (): CreateFlowState => ({
  anchor: null,
  pending: false,
  result: "idle",
});

export const beginCreate = (state: CreateFlowState, anchor: CreationAnchorContext): CreateFlowState => ({
  ...state,
  anchor,
  pending: true,
  result: "idle",
});

export const markCreateSucceeded = (state: CreateFlowState): CreateFlowState => ({
  ...state,
  pending: false,
  result: "created",
});

export const markCreateRejected = (state: CreateFlowState): CreateFlowState => ({
  ...state,
  pending: false,
  result: "rejected",
});

export const clearCreateFlow = (state: CreateFlowState): CreateFlowState => ({
  ...state,
  anchor: null,
  pending: false,
  result: "idle",
});

export interface ViewerEditSessionState {
  mode: ViewerMode;
  hasUnsavedChanges: boolean;
  saveStatus: SaveLifecycleStatus;
}

export const createViewerEditSessionState = (): ViewerEditSessionState => {
  return {
    mode: "view",
    hasUnsavedChanges: false,
    saveStatus: "idle",
  };
};

export const enterEditMode = (state: ViewerEditSessionState): ViewerEditSessionState => {
  return {
    ...state,
    mode: "edit",
    saveStatus: "idle",
  };
};

export const updateUnsavedChanges = (
  state: ViewerEditSessionState,
  hasUnsavedChanges: boolean,
): ViewerEditSessionState => {
  return {
    ...state,
    hasUnsavedChanges,
  };
};

export const beginSave = (state: ViewerEditSessionState): ViewerEditSessionState => {
  return {
    ...state,
    saveStatus: "saving",
  };
};

export const markSaveWarning = (state: ViewerEditSessionState): ViewerEditSessionState => {
  return {
    ...state,
    saveStatus: "warning",
  };
};

export const markSaveFailed = (state: ViewerEditSessionState): ViewerEditSessionState => {
  return {
    ...state,
    saveStatus: "failed",
  };
};

export const markSaveSucceeded = (state: ViewerEditSessionState): ViewerEditSessionState => {
  return {
    ...state,
    mode: "view",
    hasUnsavedChanges: false,
    saveStatus: "saved",
  };
};

export const shouldPromptUnsavedChanges = (
  state: Pick<ViewerEditSessionState, "mode" | "hasUnsavedChanges">,
  _trigger: UnsavedChangesTrigger,
): boolean => {
  return state.mode === "edit" && state.hasUnsavedChanges;
};

export const resolveSelectedIdentifier = (
  selectedIdentifier: string | null,
  documents: ViewerDocumentSummary[],
): string | null => {
  if (!documents.length) {
    return null;
  }

  if (!selectedIdentifier) {
    return documents[0]?.identifier ?? null;
  }

  return selectedIdentifier;
};

export const resolveSelectedIdentifierAfterDelete = (
  selectedIdentifier: string | null,
  documents: ViewerDocumentSummary[],
): string | null => {
  if (!documents.length) {
    return null;
  }

  if (!selectedIdentifier) {
    return documents[0]?.identifier ?? null;
  }

  const stillExists = documents.some((document) => document.identifier === selectedIdentifier);
  return stillExists ? selectedIdentifier : (documents[0]?.identifier ?? null);
};
