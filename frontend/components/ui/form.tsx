import type React from "react";

import { cn } from "@/lib/utils";

export function FormField({
  label,
  hint,
  error,
  required,
  className,
  children
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ms-1 text-destructive">*</span> : null}
      </label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function FormSection({
  title,
  description,
  className,
  children
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card p-5 md:p-6", className)}>
      <header className="mb-4 space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </header>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}
