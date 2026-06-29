"use client";

import {
  WORKFLOW_COMMENT_TYPE_LABELS,
  WORKFLOW_TIMELINE_LABELS
} from "@/features/workflow/workflow-labels";

export type TimelineEntry = {
  id: number;
  action: string;
  notes?: string | null;
  createdAt?: string;
  actor?: { name: string } | null;
  taskId?: number | null;
};

export function WorkflowTimeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <div className="rounded-lg border border-atlas-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-bold">الخط الزمني</h3>
      <ul className="space-y-3">
        {entries.length === 0 ? (
          <li className="text-sm text-atlas-muted">لا توجد أحداث بعد</li>
        ) : (
          entries.map((e) => (
            <li key={e.id} className="border-s-2 border-atlas-brand/40 ps-3">
              <p className="text-sm font-medium">
                {WORKFLOW_TIMELINE_LABELS[e.action] ?? e.action}
              </p>
              {e.notes ? <p className="mt-0.5 text-xs text-atlas-ink dark:text-zinc-300">{e.notes}</p> : null}
              <p className="mt-1 text-[10px] text-atlas-muted">
                {e.actor?.name ?? "—"}
                {e.createdAt ? ` · ${new Date(e.createdAt).toLocaleString("ar")}` : ""}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
