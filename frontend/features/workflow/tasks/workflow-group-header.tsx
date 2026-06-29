"use client";

import { Workflow } from "lucide-react";

type Props = {
  templateName?: string | null;
  workflowNumber: string;
  taskCount: number;
};

export function WorkflowGroupHeader({ templateName, workflowNumber, taskCount }: Props) {
  const taskLabel = taskCount === 1 ? "مهمة" : "مهام";

  return (
    <header className="flex items-center justify-between gap-4 border-b border-atlas-border px-4 py-3 dark:border-zinc-700">
      {/* يمين الشاشة (بداية RTL) — القالب */}
      {templateName ? (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-atlas-brand text-white shadow-sm shadow-atlas-brand/25"
            aria-hidden
          >
            <Workflow className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-atlas-brand/80">القالب</p>
            <p className="truncate text-base font-bold text-atlas-ink dark:text-zinc-100">{templateName}</p>
          </div>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* يسار الشاشة (نهاية RTL) — التنفيذ + العدد */}
      <div className="flex shrink-0 items-center gap-3">
        <div className="text-end">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-atlas-muted">التنفيذ</p>
          <p className="mt-0.5 font-mono text-base font-bold leading-tight text-atlas-brand">{workflowNumber}</p>
        </div>

        <div className="h-10 w-px shrink-0 bg-atlas-border/80 dark:bg-zinc-600" aria-hidden />

        <div className="flex min-w-[56px] flex-col items-center justify-center rounded-xl bg-atlas-brand/10 px-3 py-1.5 dark:bg-atlas-brand/20">
          <span className="text-xl font-bold leading-none text-atlas-brand">{taskCount}</span>
          <span className="mt-0.5 text-[10px] font-medium text-atlas-muted">{taskLabel}</span>
        </div>
      </div>
    </header>
  );
}
