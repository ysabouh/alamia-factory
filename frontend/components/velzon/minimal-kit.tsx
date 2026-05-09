"use client";

import type { ReactNode } from "react";
import * as React from "react";

import { cn } from "@/lib/utils";

/** خلفية صفحة كاملة داخل `main` — ألوان Atlas */
export function VzMinimalShell({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "-mx-4 -mt-4 min-h-[calc(100vh-5rem)] bg-atlas-canvas px-4 pb-10 pt-6 text-[0.913rem] leading-relaxed text-atlas-slate md:-mx-6 md:-mt-6 md:px-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function VzCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("overflow-hidden rounded-md border border-atlas-rule bg-atlas-paper shadow-atlasCard", className)}>
      {children}
    </div>
  );
}

export function VzCardHeader({
  title,
  action,
  className,
  subtitle
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
  subtitle?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-atlas-rule px-4 py-4",
        className
      )}
    >
      <div className="min-w-0 space-y-0.5">
        <h3 className="text-[0.9675rem] font-semibold text-atlas-ink">{title}</h3>
        {subtitle ? <div className="text-xs text-atlas-muted">{subtitle}</div> : null}
      </div>
      {action ? <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function VzCardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-4", className)}>{children}</div>;
}

export function VzEyebrow({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <p className={cn("text-xs font-semibold uppercase tracking-[0.12em] text-atlas-muted", className)}>{children}</p>
  );
}

export function VzKpiCard({
  title,
  value,
  deltaLabel,
  deltaPositive,
  footnote,
  Icon
}: {
  title: string;
  value: string;
  deltaLabel: string;
  deltaPositive?: boolean | null;
  footnote?: string;
  Icon?: React.ComponentType<{ className?: string }>;
}) {
  const Trend = Icon;
  const showDeltaTone = deltaPositive !== null && deltaPositive !== undefined;

  return (
    <VzCard className="h-full transition-shadow hover:shadow-atlasLift">
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <VzEyebrow>{title}</VzEyebrow>
          {Trend ? <Trend className="h-[18px] w-[18px] text-atlas-muted opacity-85" aria-hidden /> : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {showDeltaTone ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-semibold tabular-nums",
                deltaPositive ? "bg-atlas-success/12 text-atlas-success" : "bg-atlas-danger/12 text-atlas-danger"
              )}
            >
              {deltaLabel}
            </span>
          ) : (
            <span className="text-xs font-semibold text-atlas-muted">{deltaLabel}</span>
          )}
          <span className="text-2xl font-semibold tracking-tight text-atlas-ink">{value}</span>
        </div>

        {footnote ? <p className="mt-2 text-xs font-medium text-atlas-brand">{footnote}</p> : null}
      </div>
    </VzCard>
  );
}

const atlasBadgeVariants: Record<"success" | "warning" | "danger" | "info" | "muted", string> = {
  success: "bg-atlas-success/12 text-atlas-success ring-1 ring-inset ring-atlas-success/25",
  warning: "bg-atlas-warning/15 text-amber-950 ring-1 ring-inset ring-atlas-warning/35",
  danger: "bg-atlas-danger/12 text-atlas-danger ring-1 ring-inset ring-atlas-danger/30",
  info: "bg-atlas-info/12 text-atlas-info ring-1 ring-inset ring-atlas-info/28",
  muted: "bg-atlas-tableHead text-atlas-muted ring-1 ring-inset ring-atlas-rule"
};

export function VzBadge({
  tone,
  children,
  className
}: {
  tone: keyof typeof atlasBadgeVariants;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("rounded px-2 py-[3px] text-[11px] font-semibold", atlasBadgeVariants[tone], className)}>
      {children}
    </span>
  );
}

export function VzTable({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"table">) {
  return (
    <div className="-mx-[1px] overflow-x-auto">
      <table className={cn("w-full min-w-[640px] border-collapse text-[0.8375rem]", className)} {...props} />
    </div>
  );
}

export function VzTableHead({ className, ...props }: React.ComponentPropsWithoutRef<"thead">) {
  return <thead className={cn("border-b border-atlas-rule bg-atlas-tableHead", className)} {...props} />;
}

export function VzTh({ className, ...props }: React.ComponentPropsWithoutRef<"th">) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-4 py-3 text-start align-middle text-[0.69875rem] font-semibold uppercase tracking-wide text-atlas-muted",
        className
      )}
      {...props}
    />
  );
}

export function VzTd({ className, ...props }: React.ComponentPropsWithoutRef<"td">) {
  return (
    <td className={cn("border-b border-atlas-rule px-4 py-[0.7rem] align-middle text-atlas-slate", className)} {...props} />
  );
}

export function VzTr({ className, ...props }: React.ComponentPropsWithoutRef<"tr">) {
  return <tr className={cn("transition-colors hover:bg-atlas-brand/[0.04]", className)} {...props} />;
}
