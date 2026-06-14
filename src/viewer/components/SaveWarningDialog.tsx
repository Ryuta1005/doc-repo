import React from "react";

interface SaveWarningDialogProps {
  open: boolean;
  warnings: string[];
  onProceed: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function SaveWarningDialog({
  open,
  warnings,
  onProceed,
  onCancel,
  isSaving,
}: SaveWarningDialogProps): React.JSX.Element | null {
  if (!open) {
    return null;
  }

  return (
    <div className="dialog-overlay" role="presentation">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="save-warning-title">
        <h2 id="save-warning-title">未対応要素が含まれています</h2>
        <p>原文保持を優先しますが、保持不能な場合は内容が変化する可能性があります。</p>
        <ul className="dialog-list">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
        <div className="dialog-actions">
          <button type="button" className="editor-toolbar-button" onClick={onCancel}>
            キャンセル
          </button>
          <button
            type="button"
            className="editor-toolbar-button editor-toolbar-button--primary"
            onClick={onProceed}
            disabled={isSaving}
          >
            {isSaving ? "保存中..." : "保存を続ける"}
          </button>
        </div>
      </div>
    </div>
  );
}
