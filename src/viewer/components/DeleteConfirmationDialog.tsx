import React from "react";

import { useLocale } from "../locale/index.js";

interface DeleteConfirmationDialogProps {
  open: boolean;
  targetName: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending?: boolean;
}

export function DeleteConfirmationDialog({
  open,
  targetName,
  onCancel,
  onConfirm,
  pending = false,
}: DeleteConfirmationDialogProps): React.JSX.Element | null {
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
        onCancel();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div className="dialog-overlay" role="presentation">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
        <h4 id="delete-dialog-title" className="dialog-title-compact">
          {t("deleteDialogTitle")}
        </h4>
        <p className="viewer-delete-target-name">{targetName}</p>
        <p>{t("deleteDialogWarning")}</p>
        <div className="dialog-actions">
          <button ref={cancelButtonRef} type="button" className="btn btn-ghost" onClick={onCancel} disabled={pending}>
            {t("deleteCancel")}
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={pending}>
            {t("deleteConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
