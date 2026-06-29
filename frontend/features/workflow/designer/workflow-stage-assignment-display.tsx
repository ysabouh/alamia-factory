"use client";

import { User, Users } from "lucide-react";

import type { AssignmentDisplay } from "@/features/workflow/designer/workflow-stage-assignment";

type Props = {
  display: AssignmentDisplay;
  compact?: boolean;
};

export function WorkflowStageAssignmentDisplay({ display, compact = false }: Props) {
  const { typeLabel, assignees, subtitle, complete } = display;
  const multi = assignees.length > 1;

  if (!complete) {
    return (
      <div className="mt-2 rounded-lg border border-dashed border-red-200 bg-red-50/80 px-2.5 py-2 dark:border-red-900/60 dark:bg-red-950/30">
        <p className="text-[10px] font-medium text-red-700 dark:text-red-300">{typeLabel}</p>
        <p className="mt-0.5 text-[11px] text-red-600 dark:text-red-400">بدون تعيين</p>
      </div>
    );
  }

  return (
    <div
      className={`mt-2 rounded-lg border border-sky-100 bg-gradient-to-b from-sky-50/90 to-white px-2.5 shadow-sm dark:border-sky-900/50 dark:from-sky-950/35 dark:to-zinc-900 ${
        compact ? "py-1.5" : "py-2"
      }`}
    >
      <div className="flex items-center gap-1 text-[10px] font-semibold tracking-wide text-sky-700/90 dark:text-sky-300/90">
        {multi ? <Users className="h-3 w-3 shrink-0" /> : <User className="h-3 w-3 shrink-0" />}
        <span>{typeLabel}</span>
      </div>

      <ul className={`mt-1 space-y-0.5 ${multi ? "border-s border-sky-200/80 ps-2 dark:border-sky-800/80" : ""}`}>
        {assignees.map((name) => (
          <li
            key={name}
            className="flex items-center gap-1.5 text-[11px] font-semibold leading-snug text-slate-800 dark:text-slate-100"
          >
            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500 ring-2 ring-sky-200/80 dark:ring-sky-800/80" />
            <span className="truncate">{name}</span>
          </li>
        ))}
      </ul>

      {subtitle ? (
        <p className="mt-1 border-t border-sky-100 pt-1 text-[9px] text-sky-800/70 dark:border-sky-900/50 dark:text-sky-300/70">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
