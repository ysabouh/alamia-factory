"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
};

export function Switch({ checked = false, onCheckedChange, disabled, id, className }: Props) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
        checked ? "bg-atlas-brand" : "bg-zinc-200 dark:bg-zinc-700",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200",
          checked ? "start-[calc(100%-1.375rem)]" : "start-0.5"
        )}
      />
    </button>
  );
}
