"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { TaskTemplateChip } from "@/features/workflow/tasks/task-template-chip";
import {
  WORKFLOW_COMMENT_TYPE_LABELS,
  WORKFLOW_PRIORITY_LABELS,
  WORKFLOW_STATUS_LABELS
} from "@/features/workflow/workflow-labels";
import { workflowApi, type WorkflowTaskJson } from "@/lib/api/workflow-client";

type Props = {
  taskId: number;
  onUpdated: () => void;
  onClose: () => void;
};

const ACTIVE_STATUSES = new Set(["assigned", "pending", "accepted", "in_progress", "waiting_information"]);

export function TaskDetailsDrawer({ taskId, onUpdated, onClose }: Props) {
  const { user, can } = useFactoryAuth();
  const canManage = can("workflow.instances.manage");

  const [task, setTask] = useState<WorkflowTaskJson | null>(null);
  const [checklist, setChecklist] = useState<WorkflowTaskJson["checklist"]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTask = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const t = await workflowApi.getTask(taskId);
      setTask(t);
      setChecklist(t.checklist ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر تحميل المهمة");
      setTask(null);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    void loadTask();
  }, [loadTask]);

  const employeeId = user?.employeeId ? Number(user.employeeId) : null;
  const isAssignee = task?.assignedTo != null && employeeId === task.assignedTo;
  const canAct = isAssignee && task != null && ACTIVE_STATUSES.has(task.status);

  const run = async (fn: () => Promise<unknown>, refresh = true) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      if (refresh) {
        await loadTask();
        onUpdated();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    } finally {
      setBusy(false);
    }
  };

  const showApprove =
    canManage &&
    task?.instanceStatus === "waiting_approval" &&
    (task.stage?.requiresApproval ?? false) &&
    task.status === "completed";

  const progress = useMemo(() => {
    const total = checklist?.length ?? 0;
    if (total === 0) return { done: 0, total: 0, percent: 0 };
    const done = (checklist ?? []).filter((c) => c.isCompleted).length;
    return { done, total, percent: Math.round((done / total) * 100) };
  }, [checklist]);
  const waitingManager =
    task?.status === "completed" &&
    task.instanceStatus === "waiting_approval" &&
    task.stage?.requiresApproval &&
    !canManage;

  if (loading || !task) {
    return (
      <div className="flex h-full flex-col p-4">
        <p className="text-sm text-atlas-muted">{loading ? "جاري التحميل..." : (error ?? "المهمة غير موجودة")}</p>
        <button type="button" onClick={onClose} className="mt-3 text-sm text-atlas-brand hover:underline">
          إغلاق
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {task.templateName ? (
        <TaskTemplateChip
          templateName={task.templateName}
          workflowNumber={task.workflowNumber}
          taskNumber={task.taskNumber}
          size="md"
          className="rounded-none border-0 border-b border-atlas-brand/15"
        />
      ) : null}

      <div className="flex items-start justify-between gap-3 border-b border-atlas-border p-4 dark:border-zinc-700">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-atlas-muted">المرحلة</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold leading-snug">{task.stage?.name ?? task.taskNumber}</h2>
            <Badge variant="secondary">{WORKFLOW_PRIORITY_LABELS[task.priority] ?? task.priority}</Badge>
            <Badge variant="outline">{WORKFLOW_STATUS_LABELS[task.status] ?? task.status}</Badge>
          </div>
          {!task.templateName ? (
            <p className="mt-1 font-mono text-xs text-atlas-muted">{task.taskNumber}</p>
          ) : null}
          {task.instanceId ? (
            <Link
              href={`/ar/workflow/instances/${task.instanceId}`}
              className="mt-2 inline-flex items-center gap-1 text-xs text-atlas-brand hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              فتح التنفيذ الكامل
            </Link>
          ) : null}
        </div>
        <button type="button" onClick={onClose} className="shrink-0 text-sm text-atlas-muted hover:text-atlas-ink">
          إغلاق
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {waitingManager ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            أنهيت مهمتك. السير بانتظار اعتماد المدير للإغلاق.
          </p>
        ) : null}
        {showApprove ? (
          <p className="rounded-md bg-violet-50 px-3 py-2 text-xs text-violet-900 dark:bg-violet-950/40 dark:text-violet-100">
            <ShieldCheck className="mb-1 inline h-4 w-4" /> أنهى المنفّذ المهمة. اضغط «اعتماد» لإغلاق سير العمل.
          </p>
        ) : null}

        {task.assignee?.name ? (
          <p className="text-xs text-atlas-muted">المعيَّن: {task.assignee.name}</p>
        ) : null}

        {(task.comments?.length ?? 0) > 0 ? (
          <div>
            <h3 className="mb-2 text-sm font-semibold">التعليقات السابقة</h3>
            <ul className="space-y-2">
              {task.comments!.map((c) => (
                <li key={c.id} className="rounded-md border border-atlas-border px-3 py-2 text-sm dark:border-zinc-700">
                  <p className="text-[10px] text-atlas-muted">
                    {WORKFLOW_COMMENT_TYPE_LABELS[c.type] ?? c.type}
                    {c.author?.name ? ` · ${c.author.name}` : ""}
                    {c.createdAt ? ` · ${new Date(c.createdAt).toLocaleString("ar")}` : ""}
                  </p>
                  <p className="mt-1">{c.body}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {checklist.length > 0 ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">قائمة التحقق</h3>
              {progress.total > 0 ? (
                <span className="text-xs text-atlas-muted">
                  {progress.done}/{progress.total}
                </span>
              ) : null}
            </div>
            {progress.total > 0 ? (
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-atlas-surface dark:bg-zinc-800">
                <div className="h-full rounded-full bg-atlas-brand" style={{ width: `${progress.percent}%` }} />
              </div>
            ) : null}
            <ul className="space-y-2">
              {checklist.map((c) => (
                <li key={c.id}>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={c.isCompleted}
                      disabled={busy || !canAct}
                      onChange={(e) =>
                        setChecklist((prev) =>
                          prev.map((x) =>
                            x.checklistItemId === c.checklistItemId ? { ...x, isCompleted: e.target.checked } : x
                          )
                        )
                      }
                    />
                    {c.label}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {(canAct || showApprove) && (
          <textarea
            className="atlas-input w-full"
            rows={3}
            placeholder={
              showApprove && !canAct
                ? "ملاحظة اختيارية عند الموافقة (أضف تعليقاً منفصلاً أدناه)"
                : "ملاحظات عند الإكمال، أو نص الرفض/التوضيح"
            }
            value={note}
            disabled={busy}
            onChange={(e) => setNote(e.target.value)}
          />
        )}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-atlas-border p-4 dark:border-zinc-700">
        {canAct && ["assigned", "pending"].includes(task.status) ? (
          <button
            type="button"
            disabled={busy}
            className="atlas-btn-secondary text-sm"
            onClick={() => run(() => workflowApi.acceptTask(task.id))}
          >
            قبول
          </button>
        ) : null}

        {canAct ? (
          <>
            <button
              type="button"
              disabled={busy}
              className="atlas-btn-primary text-sm"
              onClick={() =>
                run(() =>
                  workflowApi.completeTask(task.id, {
                    checklist: checklist.map((c) => ({
                      checklistItemId: c.checklistItemId,
                      isCompleted: c.isCompleted
                    })),
                    note: note.trim() || undefined
                  })
                )
              }
            >
              إكمال
            </button>
            {task.stage?.allowRejection ? (
              <button
                type="button"
                disabled={busy || !note.trim()}
                className="atlas-btn-secondary text-sm text-red-600"
                onClick={() => run(() => workflowApi.rejectTask(task.id, note.trim()))}
              >
                رفض
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy || !note.trim()}
              className="atlas-btn-secondary text-sm"
              onClick={() => run(() => workflowApi.clarifyTask(task.id, note.trim()))}
            >
              طلب توضيح
            </button>
            <button
              type="button"
              disabled={busy || !note.trim()}
              className="atlas-btn-secondary text-sm"
              onClick={async () => {
                const body = note.trim();
                if (!body) return;
                await run(async () => {
                  await workflowApi.commentTask(task.id, body);
                  setNote("");
                });
              }}
            >
              إضافة تعليق
            </button>
          </>
        ) : null}

        {showApprove ? (
          <button
            type="button"
            disabled={busy}
            className="atlas-btn-primary text-sm"
            onClick={() => run(() => workflowApi.approveTask(task.id))}
          >
            اعتماد وإغلاق السير
          </button>
        ) : null}

        {!canAct && !showApprove ? (
          <p className="text-xs text-atlas-muted">لا توجد إجراءات متاحة لهذه المهمة.</p>
        ) : null}
      </div>
    </div>
  );
}
