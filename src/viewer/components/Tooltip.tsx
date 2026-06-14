import React from "react";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps): React.JSX.Element {
  const tooltipId = React.useId();

  return (
    <span className="group relative inline-flex" aria-describedby={tooltipId}>
      {children}
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none invisible absolute left-1/2 top-full z-[100] mt-2 -translate-x-1/2 -translate-y-1 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-all delay-0 duration-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-hover:delay-150 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-focus-within:delay-150"
      >
        {content}
      </span>
    </span>
  );
}
