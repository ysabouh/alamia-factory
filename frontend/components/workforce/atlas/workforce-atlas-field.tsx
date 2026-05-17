"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const fieldClass =
  "flex h-10 w-full rounded-sm border border-atlas-rule bg-atlas-paper px-3 py-2 text-sm text-atlas-ink shadow-atlasBar placeholder:text-atlas-muted transition-[border-color,box-shadow] focus-visible:border-atlas-brand/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-atlas-brand/25 disabled:cursor-not-allowed disabled:opacity-50";

export type WfmInputProps = React.InputHTMLAttributes<HTMLInputElement> & { monospace?: boolean };

export const WfmInput = React.forwardRef<HTMLInputElement, WfmInputProps>(
  ({ className, type = "text", monospace, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(fieldClass, monospace && "font-mono tabular-nums", className)}
      {...props}
    />
  )
);
WfmInput.displayName = "WfmInput";

export const WfmTextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 4, ...props }, ref) => (
    <textarea ref={ref} rows={rows} className={cn(fieldClass, "min-h-[88px] resize-y", className)} {...props} />
  )
);
WfmTextarea.displayName = "WfmTextarea";

export const WfmSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(fieldClass, "cursor-pointer", className)} {...props}>
      {children}
    </select>
  )
);
WfmSelect.displayName = "WfmSelect";
