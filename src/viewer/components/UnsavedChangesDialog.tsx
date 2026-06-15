import React from "react";
import { useLocale } from "../locale/index.js";

interface UnsavedChangesDialogProps {
  open: boolean;
  triggerLabel: string;
  onContinueEditing: () => void;
  onDiscardChanges: () => void;
}

export function UnsavedChangesDialog({
  open,
  triggerLabel,
  onContinueEditing,
  onDiscardChanges,
}: UnsavedChangesDialogProps): React.JSX.Element | null {
  const { t } = useLocale();
  const continueButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    continueButtonRef.current?.focus();

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
        <p>
          {triggerLabel}: {t("unsavedBody")}
        </p>
        <div className="dialog-actions">
          <button
            type="button"
            className="rounded px-3 py-2 font-medium text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            onClick={onDiscardChanges}
          >
            {t("discardChanges")}
          </button>
          <button ref={continueButtonRef} type="button" className="btn btn-primary" onClick={onContinueEditing}>
            {t("continueEditing")}
          </button>
        </div>
      </div>
    </div>
  );
}
