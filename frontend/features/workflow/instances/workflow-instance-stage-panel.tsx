"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Clock, User } from "lucide-react";

import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { WorkflowInstanceActions } from "@/features/workflow/instances/workflow-instance-actions";
import { WORKFLOW_STATUS_LABELS } from "@/features/workflow/workflow-labels";
import type { WorkflowInstanceJson, WorkflowTaskJson } from "@/lib/api/workflow-client";

type Props = {
  instance: WorkflowInstanceJson;
  activeTask: WorkflowTaskJson | null;
  onRefresh: () => void;
  busy: boolean;
  setBusy: (v: boolean) => void;
  setError: (v: string | null) => void;
};

export function WorkflowInstanceStagePanel({
  instance,
  activeTask,
  onRefresh,
  busy,
  setBusy,
  setError
}: Props) {
  const { user } = useFactoryAuth();
  const employeeId = user?.employeeId ? Number(user.employeeId) : null;
  const [tab, setTab] = useState<"tasks" | "files" | "checklist">("tasks");
  const stage = instance.currentStage;
  const stageTasks = (instance.tasks ?? []).filter((t) => t.stageId === instance.currentStageId);
  const myTasks = useMemo(
    () => (instance.tasks ?? []).filter((t) => employeeId != null && t.assignedTo === employeeId),
    [instance.tasks, employeeId]
  );
  const myPendingOnOtherStages = myTasks.filter((t) => t.stageId !== instance.currentStageId && t.status !== "completed");

  if (!stage) {
    return (
      <div className="rounded-lg border border-atlas-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm text-atlas-muted">اكتمل سير العمل — لا توجد مرحلة حالية.</p>
      </div>
    );
  }

  const allAttachments = (instance.tasks ?? []).flatMap((t) =>
    (t.attachments ?? []).map((a) => ({ ...a, taskNumber: t.taskNumber, stageName: t.stage?.name }))
  );

  return (
    <div className="flex h-full flex-col rounded-lg border border-atlas-border bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <div className="border-b border-atlas-border p-4 dark:border-zinc-700">
        <p className="text-xs text-atlas-muted">المرحلة الحالية</p>
        <h3 className="text-lg font-bold">{stage.name}</h3>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-atlas-muted">
          {activeTask?.assignee?.name ? (
            <span className="inline-flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> {activeTask.assignee.name}
            </span>
          ) : null}
          {stage.slaDurationMinutes ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> SLA {stage.slaDurationMinutes} د
            </span>
          ) : null}
          <span>{WORKFLOW_STATUS_LABELS[instance.status] ?? instance.status}</span>
        </div>
      </div>

      <div className="flex border-b border-atlas-border text-xs dark:border-zinc-700">
        {(["tasks", "files", "checklist"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 px-3 py-2 ${tab === t ? "border-b-2 border-atlas-brand font-bold text-atlas-brand" : "text-atlas-muted"}`}
          >
            {t === "tasks" ? "مهام" : t === "files" ? "ملفات" : "قائمة تحقق"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "tasks" ? (
          <div className="space-y-4">
            <ul className="space-y-2">
              {stageTasks.map((t) => (
                <li key={t.id} className="rounded-md border border-atlas-border px-3 py-2 text-sm dark:border-zinc-700">
                  <p className="font-medium">{t.taskNumber}</p>
                  <p className="text-xs text-atlas-muted">
                    {WORKFLOW_STATUS_LABELS[t.status] ?? t.status}
                    {t.assignee?.name ? ` · ${t.assignee.name}` : ""}
                  </p>
                </li>
              ))}
              {stageTasks.length === 0 ? <p className="text-sm text-atlas-muted">لا مهام في هذه المرحلة.</p> : null}
            </ul>

            {myTasks.length > 0 ? (
              <div className="rounded-md border border-dashed border-atlas-border p-3 dark:border-zinc-700">
                <p className="text-xs font-bold text-atlas-muted">مهامك في هذا التنفيذ</p>
                <ul className="mt-2 space-y-2">
                  {myTasks.map((t) => (
                    <li key={t.id} className="text-sm">
                      <span className="font-medium">{t.stage?.name ?? "—"}</span>
                      <span className="mx-1 text-atlas-muted">·</span>
                      <span className="text-xs text-atlas-muted">
                        {WORKFLOW_STATUS_LABELS[t.status] ?? t.status}
                      </span>
                      {t.stageId !== instance.currentStageId && t.status === "completed" ? (
                        <span className="mt-0.5 block text-[10px] text-atlas-muted">مرحلة سابقة — اكتملت</span>
                      ) : null}
                      {t.stageId !== instance.currentStageId && t.status !== "completed" ? (
                        <span className="mt-0.5 block text-[10px] text-amber-700">مرحلة لاحقة — لم تبدأ بعد</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {myPendingOnOtherStages.length === 0 && myTasks.every((t) => t.status === "completed") ? (
                  <p className="mt-2 text-[11px] text-atlas-muted">
                    لا مهام نشطة لك حالياً. المراحل المعيّنة لك على مسارات بديلة (مثل «طلب قطع غيار») تظهر
                    على الخريطة فقط عند اختيار ذلك المسار.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {tab === "files" ? (
          <div className="space-y-2">
            {allAttachments.length === 0 ? (
              <p className="text-sm text-atlas-muted">لا مرفقات بعد.</p>
            ) : (
              allAttachments.map((a) => (
                <a
                  key={a.id}
                  href={a.filePath}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-md border border-atlas-border px-3 py-2 text-sm hover:bg-atlas-surface dark:border-zinc-700"
                >
                  {a.fileName}
                  <span className="block text-[10px] text-atlas-muted">
                    {a.stageName} · {a.taskNumber}
                  </span>
                </a>
              ))
            )}
          </div>
        ) : null}

        {tab === "checklist" && activeTask ? (
          <ul className="space-y-2">
            {(activeTask.checklist ?? []).map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-sm">
                {c.isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Circle className="h-4 w-4 text-atlas-muted" />
                )}
                {c.label ?? `بند ${c.checklistItemId}`}
              </li>
            ))}
            {(activeTask.checklist ?? []).length === 0 ? (
              <p className="text-sm text-atlas-muted">لا قائمة تحقق لهذه المهمة.</p>
            ) : null}
          </ul>
        ) : tab === "checklist" ? (
          <p className="text-sm text-atlas-muted">اختر مهمة نشطة لعرض القائمة.</p>
        ) : null}
      </div>

      <WorkflowInstanceActions
        instance={instance}
        activeTask={activeTask}
        onRefresh={onRefresh}
        busy={busy}
        setBusy={setBusy}
        setError={setError}
      />
    </div>
  );
}
