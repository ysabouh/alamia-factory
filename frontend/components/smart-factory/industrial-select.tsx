"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface IndustrialSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const IndustrialSelect = React.forwardRef<HTMLSelectElement, IndustrialSelectProps>(
  ({ className, children, ...props }, ref) => {

    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "h-10 w-full appearance-none rounded-lg border border-sf-stroke/65 bg-sf-panel/80 px-3 pr-9 text-sm text-sf-copy",
            "focus-visible:border-sf-accentCool/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sf-accentCool/35",
            "disabled:cursor-not-allowed disabled:opacity-45",
            className
          )}
          {...props}
        >
          {children}
        </select>

        <span className="pointer-events-none absolute end-2.5 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-b-2 border-s-2 border-sf-stroke" />
      </div>
    );

  }

);

IndustrialSelect.displayName = "IndustrialSelect";
