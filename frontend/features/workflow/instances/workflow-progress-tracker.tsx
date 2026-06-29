"use client";

import { CheckCircle2, Circle, CircleDot } from "lucide-react";

import { WORKFLOW_STAGE_STATE_LABELS } from "@/features/workflow/workflow-labels";

type Stage = { id: number; name: string; state: string };

export function WorkflowProgressTracker({
  progressPercent,
  stages
}: {
  progressPercent: number;
  stages: Stage[];
}) {
  return (
    <div className="rounded-lg border border-atlas-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold">تقدم سير العمل</h3>
        <span className="text-sm font-semibold text-atlas-brand">{progressPercent}%</span>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-atlas-surface dark:bg-zinc-800">
        <div className="h-full bg-atlas-brand transition-all" style={{ width: `${progressPercent}%` }} />
      </div>
      <ol className="space-y-2">
        {stages.map((s) => (
          <li key={s.id} className="flex items-center gap-2 text-sm">
            {s.state === "completed" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : s.state === "current" ? (
              <CircleDot className="h-4 w-4 text-atlas-brand" />
            ) : (
              <Circle className="h-4 w-4 text-atlas-muted" />
            )}
            <span className={s.state === "current" ? "font-semibold" : ""}>
              {s.name}
              <span className="ms-1 text-[10px] font-normal text-atlas-muted">
                ({WORKFLOW_STAGE_STATE_LABELS[s.state] ?? s.state})
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
