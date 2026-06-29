"use client";

import {
  WORKFLOW_COMMENT_TYPE_LABELS,
  WORKFLOW_STATUS_LABELS
} from "@/features/workflow/workflow-labels";
import type { WorkflowTaskJson } from "@/lib/api/workflow-client";

type Props = {
  tasks: WorkflowTaskJson[];
};

export function WorkflowInstanceStageComments({ tasks }: Props) {
  const withComments = tasks.filter((t) => (t.comments?.length ?? 0) > 0);

  if (withComments.length === 0) {
    return (
      <div className="rounded-lg border border-atlas-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="mb-2 text-sm font-bold">تعليقات المراحل</h3>
        <p className="text-sm text-atlas-muted">لا توجد تعليقات مسجّلة بعد.</p>
      </div>
    );
  }

  const byStage = new Map<string, WorkflowTaskJson[]>();
  for (const t of withComments) {
    const key = t.stage?.name ?? `مرحلة ${t.stageId}`;
    const list = byStage.get(key) ?? [];
    list.push(t);
    byStage.set(key, list);
  }

  return (
    <div className="rounded-lg border border-atlas-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-bold">تعليقات المراحل</h3>
      <div className="space-y-4">
        {[...byStage.entries()].map(([stageName, stageTasks]) => (
          <section key={stageName}>
            <h4 className="mb-2 text-xs font-semibold text-atlas-brand">{stageName}</h4>
            <ul className="space-y-3">
              {stageTasks.flatMap((task) =>
                (task.comments ?? []).map((c) => (
                  <li
                    key={`${task.id}-${c.id}`}
                    className="rounded-md border border-atlas-border bg-atlas-surface/40 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/40"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-atlas-muted">
                      <span className="font-mono">{task.taskNumber}</span>
                      <span>·</span>
                      <span>{WORKFLOW_COMMENT_TYPE_LABELS[c.type] ?? c.type}</span>
                      <span>·</span>
                      <span>{WORKFLOW_STATUS_LABELS[task.status] ?? task.status}</span>
                      {task.assignee?.name ? (
                        <>
                          <span>·</span>
                          <span>{task.assignee.name}</span>
                        </>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-atlas-ink dark:text-zinc-200">{c.body}</p>
                    <p className="mt-1 text-[10px] text-atlas-muted">
                      {c.author?.name ?? "—"}
                      {c.createdAt ? ` · ${new Date(c.createdAt).toLocaleString("ar")}` : ""}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
