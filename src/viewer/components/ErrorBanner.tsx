import React from "react";

interface ErrorBannerProps {
  message: string;
  hint?: string;
}

export function ErrorBanner({ message, hint }: ErrorBannerProps): React.JSX.Element {
  return (
    <div className="viewer-error" role="alert">
      <p>{message}</p>
      {hint ? <p className="viewer-error-hint">{hint}</p> : null}
    </div>
  );
}
