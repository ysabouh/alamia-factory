"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { TaskTemplateChip } from "@/features/workflow/tasks/task-template-chip";
import { WORKFLOW_PRIORITY_LABELS, WORKFLOW_STATUS_LABELS } from "@/features/workflow/workflow-labels";
import { workflowApi, type WorkflowTaskJson } from "@/lib/api/workflow-client";

const COLUMNS = [
  { id: "assigned", title: "معيّن", tone: "bg-slate-100 dark:bg-zinc-800" },
  { id: "accepted", title: "مقبول", tone: "bg-sky-50 dark:bg-sky-950/30" },
  { id: "in_progress", title: "قيد التنفيذ", tone: "bg-blue-50 dark:bg-blue-950/30" },
  { id: "completed", title: "مكتمل", tone: "bg-emerald-50 dark:bg-emerald-950/30" }
];

type Props = {
  tasks: WorkflowTaskJson[];
  onSelect: (t: WorkflowTaskJson) => void;
  onRefresh: () => void;
};

export function TaskKanbanBoard({ tasks, onSelect, onRefresh }: Props) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const taskId = Number(e.active.id);
    const newStatus = String(e.over?.id ?? "");
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !newStatus || newStatus === task.status) return;

    try {
      if (newStatus === "accepted") await workflowApi.acceptTask(taskId);
      else if (newStatus === "completed") await workflowApi.completeTask(taskId, {});
      onRefresh();
    } catch {
      /* revert visually on refresh */
    }
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveId(Number(e.active.id))}
      onDragEnd={onDragEnd}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => (
          <div key={col.id} className={`rounded-xl p-2 ${col.tone}`} id={col.id}>
            <h3 className="mb-2 px-1 text-xs font-bold text-atlas-muted">{col.title}</h3>
            <div className="min-h-[140px] space-y-2">
              {tasks
                .filter((t) => t.status === col.id || (col.id === "assigned" && t.status === "pending"))
                .map((t) => (
                  <div
                    key={t.id}
                    id={String(t.id)}
                    draggable
                    onClick={() => onSelect(t)}
                    className="cursor-grab overflow-hidden rounded-lg border border-atlas-border bg-white text-xs shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    {t.templateName ? (
                      <TaskTemplateChip
                        templateName={t.templateName}
                        workflowNumber={t.workflowNumber}
                        size="sm"
                        className="rounded-none border-0 border-b border-atlas-brand/10"
                      />
                    ) : null}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <p className="text-[9px] font-semibold uppercase text-atlas-muted">المرحلة</p>
                          <p className="font-semibold text-atlas-ink dark:text-zinc-100">{t.stage?.name}</p>
                        </div>
                        {t.isOverdue ? <Badge variant="destructive">متأخر</Badge> : null}
                      </div>
                      <p className="mt-1 font-mono text-[10px] text-atlas-muted">{t.taskNumber}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="secondary">{WORKFLOW_STATUS_LABELS[t.status]}</Badge>
                        <Badge variant="outline">{WORKFLOW_PRIORITY_LABELS[t.priority] ?? t.priority}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="rounded-lg border border-atlas-brand bg-white p-3 text-xs shadow-lg dark:bg-zinc-900">
            {activeTask.templateName ? (
              <p className="mb-1 font-bold text-atlas-brand">{activeTask.templateName}</p>
            ) : null}
            {activeTask.stage?.name}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
