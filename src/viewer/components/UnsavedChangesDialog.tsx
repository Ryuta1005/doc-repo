import React from "react";
import { useLocale } from "../locale/index.js";

interface UnsavedChangesDialogProps {
  open: boolean;
  onContinueEditing: () => void;
  onDiscardChanges: () => void;
}

export function UnsavedChangesDialog({
  open,
  onContinueEditing,
  onDiscardChanges,
}: UnsavedChangesDialogProps): React.JSX.Element | null {
  const { t } = useLocale();
  const cancelButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    cancelButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        onContinueEditing();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onContinueEditing]);

  if (!open) {
    return null;
  }

  return (
    <div className="dialog-overlay" role="presentation">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="unsaved-dialog-title">
        <h2 id="unsaved-dialog-title">{t("unsavedTitle")}</h2>
        <p>{t("unsavedBody")}</p>
        <div className="dialog-actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="btn btn-ghost"
            onClick={onContinueEditing}
          >
            {t("cancelNavigation")}
          </button>
          <button type="button" className="btn btn-primary" onClick={onDiscardChanges}>
            {t("leavePage")}
          </button>
        </div>
      </div>
    </div>
  );
}
