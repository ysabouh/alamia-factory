"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, CheckCircle2, Clock, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { checklistProgress } from "@/features/workflow/tasks/my-tasks-utils";
import { TaskTemplateChip } from "@/features/workflow/tasks/task-template-chip";
import { WORKFLOW_PRIORITY_LABELS, WORKFLOW_STATUS_LABELS } from "@/features/workflow/workflow-labels";
import type { WorkflowTaskJson } from "@/lib/api/workflow-client";

const ACTIVE_STATUSES = new Set(["assigned", "pending", "accepted", "in_progress", "waiting_information"]);

type Props = {
  task: WorkflowTaskJson;
  selected?: boolean;
  compact?: boolean;
  showTemplate?: boolean;
  onSelect: () => void;
  onAccept?: () => void;
  onComplete?: () => void;
  busy?: boolean;
};

function priorityVariant(priority: string): "destructive" | "warning" | "secondary" {
  if (priority === "urgent") return "destructive";
  if (priority === "high") return "warning";
  return "secondary";
}

function statusVariant(status: string): "success" | "info" | "warning" | "secondary" {
  if (status === "completed") return "success";
  if (status === "in_progress" || status === "accepted") return "info";
  if (status === "waiting_approval" || status === "waiting_information") return "warning";
  return "secondary";
}

export function TaskCard({
  task,
  selected,
  compact,
  showTemplate = true,
  onSelect,
  onAccept,
  onComplete,
  busy
}: Props) {
  const progress = checklistProgress(task);
  const canAccept = ACTIVE_STATUSES.has(task.status) && ["assigned", "pending"].includes(task.status);
  const canQuickComplete =
    ACTIVE_STATUSES.has(task.status) && onComplete && (progress.total === 0 || progress.percent === 100);
  const dueLabel = task.dueAt
    ? new Date(task.dueAt).toLocaleDateString("ar", { day: "numeric", month: "short" })
    : null;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`group cursor-pointer overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md dark:bg-zinc-900 ${
        selected
          ? "border-atlas-brand ring-2 ring-atlas-brand/25"
          : task.isOverdue
            ? "border-red-300 dark:border-red-800"
            : "border-atlas-border dark:border-zinc-700"
      }`}
    >
      {showTemplate && task.templateName ? (
        <TaskTemplateChip
          templateName={task.templateName}
          workflowNumber={task.workflowNumber}
          taskNumber={compact ? undefined : task.taskNumber}
          size="md"
          className="rounded-none border-0 border-b border-atlas-brand/15"
        />
      ) : null}

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={priorityVariant(task.priority)}>
            {WORKFLOW_PRIORITY_LABELS[task.priority] ?? task.priority}
          </Badge>
          {task.isOverdue ? <Badge variant="destructive">متأخر</Badge> : null}
          <Badge variant={statusVariant(task.status)}>
            {WORKFLOW_STATUS_LABELS[task.status] ?? task.status}
          </Badge>
          {!task.templateName && task.workflowNumber ? (
            <span className="ms-auto font-mono text-[10px] text-atlas-muted">{task.workflowNumber}</span>
          ) : null}
        </div>

        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-atlas-muted">المرحلة</p>
          <h3 className="mt-0.5 text-lg font-bold leading-snug text-atlas-ink dark:text-zinc-100">
            {task.stage?.name ?? "—"}
          </h3>
        </div>

        {!task.templateName && !compact ? (
          <p className="mt-1 font-mono text-xs text-atlas-muted">{task.taskNumber}</p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-atlas-muted">
          {task.stage?.slaDurationMinutes ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              SLA {task.stage.slaDurationMinutes} د
            </span>
          ) : null}
          {dueLabel ? (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {dueLabel}
            </span>
          ) : null}
          {task.stage?.requiresApproval ? (
            <span className="rounded bg-violet-100 px-1.5 py-0.5 text-violet-800 dark:bg-violet-950 dark:text-violet-200">
              موافقة
            </span>
          ) : null}
        </div>

        {progress.total > 0 ? (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[10px] text-atlas-muted">
              <span>قائمة التحقق</span>
              <span>
                {progress.done}/{progress.total}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-atlas-surface dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-atlas-brand transition-all"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        ) : null}

        <div
          className="mt-4 flex flex-wrap items-center gap-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {canAccept && onAccept ? (
            <button type="button" disabled={busy} className="atlas-btn-secondary text-xs" onClick={onAccept}>
              قبول
            </button>
          ) : null}
          {canQuickComplete ? (
            <button
              type="button"
              disabled={busy}
              className="atlas-btn-primary inline-flex items-center gap-1 text-xs"
              onClick={onComplete}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              إكمال
            </button>
          ) : null}
          <Link
            href={`/ar/workflow/instances/${task.instanceId}`}
            className="inline-flex items-center gap-1 text-xs text-atlas-brand hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            التنفيذ
          </Link>
          <span className="ms-auto inline-flex items-center gap-0.5 text-[10px] text-atlas-muted opacity-0 transition group-hover:opacity-100">
            التفاصيل
            <ArrowLeft className="h-3 w-3" />
          </span>
        </div>
      </div>
    </article>
  );
}
