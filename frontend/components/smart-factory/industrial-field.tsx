"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { SFBody } from "./typography";

export function IndustrialField({
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
        <span className="font-industrial text-xs font-semibold uppercase tracking-[0.14em] text-sf-copy">
          {label}
        </span>
        {required ? <span className="text-[10px] font-bold text-red-400">*</span> : null}
      </label>
      {children}
      {hint && !error ? <SFBody className="text-[11px] text-sf-muted">{hint}</SFBody> : null}
      {error ? <p className="text-xs font-medium text-red-400">{error}</p> : null}
    </div>
  );
}
