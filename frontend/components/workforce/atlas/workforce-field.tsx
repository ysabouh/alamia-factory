"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function WfmField({
  id,
  label,
  hint,
  error,
  required,
  children,
  className
}: {
  id?: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="flex items-baseline gap-1.5">
        <span className="text-xs font-semibold text-atlas-ink">{label}</span>
        {required ? <span className="text-[10px] font-bold text-atlas-danger">*</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="text-[11px] text-atlas-muted">{hint}</p> : null}
      {error ? <p className="text-xs font-medium text-atlas-danger">{error}</p> : null}
    </div>
  );
}
