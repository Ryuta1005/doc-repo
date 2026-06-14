import React from "react";
import { useLocale } from "../locale/index.js";

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
  const { t } = useLocale();
  if (!open) {
    return null;
  }

  return (
    <div className="dialog-overlay" role="presentation">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="save-warning-title">
        <h2 id="save-warning-title">{t("saveWarningTitle")}</h2>
        <p>{t("saveWarningBody")}</p>
        <ul className="dialog-list">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
        <div className="dialog-actions">
          <button type="button" className="editor-toolbar-button" onClick={onCancel}>
            {t("cancel")}
          </button>
          <button
            type="button"
            className="editor-toolbar-button editor-toolbar-button--primary"
            onClick={onProceed}
            disabled={isSaving}
          >
            {isSaving ? t("saving") : t("continueSave")}
          </button>
        </div>
      </div>
    </div>
  );
}
