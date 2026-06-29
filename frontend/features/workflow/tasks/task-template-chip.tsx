"use client";

import { Workflow } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  templateName: string;
  workflowNumber?: string | null;
  taskNumber?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeStyles = {
  sm: {
    wrap: "gap-2 rounded-lg px-2.5 py-2",
    icon: "h-8 w-8 rounded-lg",
    iconInner: "h-4 w-4",
    label: "text-[9px]",
    title: "text-xs",
    meta: "text-[9px]",
    wf: "text-[10px]"
  },
  md: {
    wrap: "gap-3 rounded-xl px-3 py-2.5",
    icon: "h-10 w-10 rounded-xl",
    iconInner: "h-5 w-5",
    label: "text-[10px]",
    title: "text-sm",
    meta: "text-[10px]",
    wf: "text-xs"
  },
  lg: {
    wrap: "gap-3 rounded-xl px-4 py-3",
    icon: "h-11 w-11 rounded-xl",
    iconInner: "h-5 w-5",
    label: "text-[10px]",
    title: "text-base",
    meta: "text-xs",
    wf: "text-sm"
  }
} as const;

export function TaskTemplateChip({
  templateName,
  workflowNumber,
  taskNumber,
  size = "md",
  className
}: Props) {
  const s = sizeStyles[size];

  return (
    <div
      className={cn(
        "flex items-center justify-between border border-atlas-brand/20 bg-gradient-to-l from-atlas-brand/[0.12] via-atlas-brand/[0.06] to-transparent dark:from-atlas-brand/20 dark:via-atlas-brand/10",
        s.wrap,
        className
      )}
    >
      {/* يمين RTL — القالب + الأيقونة */}
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center bg-atlas-brand text-white shadow-sm shadow-atlas-brand/25",
            s.icon
          )}
          aria-hidden
        >
          <Workflow className={s.iconInner} strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <p className={cn("font-semibold uppercase tracking-wider text-atlas-brand/80", s.label)}>القالب</p>
          <p className={cn("truncate font-bold leading-snug text-atlas-ink dark:text-zinc-100", s.title)}>
            {templateName}
          </p>
          {taskNumber ? (
            <p className={cn("mt-0.5 truncate font-mono text-atlas-muted", s.meta)}>{taskNumber}</p>
          ) : null}
        </div>
      </div>

      {/* يسار RTL — التنفيذ */}
      {workflowNumber ? (
        <div className="shrink-0 border-s border-atlas-brand/15 ps-3 text-end">
          <p className={cn("font-semibold uppercase tracking-wider text-atlas-muted", s.label)}>التنفيذ</p>
          <p className={cn("mt-0.5 font-mono font-bold leading-tight text-atlas-brand", s.wf)}>{workflowNumber}</p>
        </div>
      ) : null}
    </div>
  );
}
