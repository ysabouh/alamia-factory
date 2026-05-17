"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface IndustrialInputProps extends React.InputHTMLAttributes<HTMLInputElement> {

  /** Wired for SCADA aesthetic */
  monospace?: boolean;

}

export const IndustrialInput = React.forwardRef<HTMLInputElement, IndustrialInputProps>(
  ({ className, type = "text", monospace, ...props }, ref) => {

    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-lg border border-sf-stroke/65 bg-sf-panel/80 px-3 py-2 text-sm text-sf-copy shadow-inner",
          "placeholder:text-sf-dim",
          "transition-[border-color,box-shadow] duration-150",
          "focus-visible:border-sf-accentCool/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sf-accentCool/35",
          "disabled:cursor-not-allowed disabled:opacity-45",
          monospace && "font-telemetry text-sf-data tracking-tight",
          className
        )}
        {...props}
      />
    );

  }

);

IndustrialInput.displayName = "IndustrialInput";

export interface IndustrialTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  monospace?: boolean;
}

export const IndustrialTextarea = React.forwardRef<HTMLTextAreaElement, IndustrialTextareaProps>(
  ({ className, monospace, rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "flex min-h-[5.5rem] w-full resize-y rounded-lg border border-sf-stroke/65 bg-sf-panel/80 px-3 py-2 text-sm text-sf-copy shadow-inner",
        "placeholder:text-sf-dim",
        "transition-[border-color,box-shadow] duration-150",
        "focus-visible:border-sf-accentCool/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sf-accentCool/35",
        "disabled:cursor-not-allowed disabled:opacity-45",
        monospace && "font-telemetry text-sf-data tracking-tight",
        className
      )}
      {...props}
    />
  )
);

IndustrialTextarea.displayName = "IndustrialTextarea";
