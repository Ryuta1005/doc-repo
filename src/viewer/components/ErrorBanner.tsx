import React from "react";

interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps): JSX.Element {
  return (
    <div className="viewer-error" role="alert">
      {message}
    </div>
  );
}
