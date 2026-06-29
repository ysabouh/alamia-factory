import type { Node } from "@xyflow/react";

import type {
  WorkflowGraphJson,
  WorkflowInstanceJson,
  WorkflowProgressJson,
  WorkflowStageJson,
  WorkflowTaskJson
} from "@/lib/api/workflow-client";
import { WORKFLOW_TIMELINE_LABELS } from "@/features/workflow/workflow-labels";

export type StageProgress = WorkflowProgressJson["stages"][number];

export type TimelineEntry = {
  id: number;
  action: string;
  notes?: string | null;
  createdAt?: string;
  taskId?: number | null;
  actorId?: number | null;
  actor?: { id?: number; name: string } | null;
  meta?: Record<string, unknown> | null;
};

export type ChecklistRow = {
  id: string;
  label: string;
  isRequired: boolean;
  isCompleted: boolean;
  taskNumber?: string;
};

export type EnrichedTimelineEntry = TimelineEntry & {
  taskNumber?: string;
  stageName?: string;
  assigneeName?: string;
  actionLabel: string;
};

export function resolveStageIdFromNodeId(graph: WorkflowGraphJson, nodeId: string): number | null {
  const match = graph.stageStates.find((s) => s.nodeId === nodeId || `stage-${s.id}` === nodeId);
  return match?.id ?? null;
}

export function getStageNodeData(graph: WorkflowGraphJson, stageId: number): Record<string, unknown> | null {
  const stage = graph.stageStates.find((s) => s.id === stageId);
  const nodeId = stage?.nodeId ?? `stage-${stageId}`;
  const nodes = (graph.definitionJson?.nodes ?? []) as Node[];
  const node = nodes.find((n) => n.id === nodeId);
  return (node?.data as Record<string, unknown> | undefined) ?? null;
}

export function getStageTasks(instance: WorkflowInstanceJson, stageId: number): WorkflowTaskJson[] {
  return (instance.tasks ?? []).filter((t) => t.stageId === stageId);
}

export function buildTasksById(instance: WorkflowInstanceJson): Map<number, WorkflowTaskJson> {
  return new Map((instance.tasks ?? []).map((t) => [t.id, t]));
}

export function enrichTimelineEntry(
  entry: TimelineEntry,
  tasksById: Map<number, WorkflowTaskJson>
): EnrichedTimelineEntry {
  const task = entry.taskId != null ? tasksById.get(entry.taskId) : undefined;
  return {
    ...entry,
    actionLabel: WORKFLOW_TIMELINE_LABELS[entry.action] ?? entry.action,
    taskNumber: task?.taskNumber,
    stageName: task?.stage?.name,
    assigneeName: task?.assignee?.name ?? entry.actor?.name
  };
}

export function getStageTimeline(
  timeline: TimelineEntry[],
  stage: StageProgress,
  tasks: WorkflowTaskJson[]
): TimelineEntry[] {
  const taskIds = new Set(tasks.map((t) => t.id));

  return timeline.filter((e) => {
    if (e.taskId != null && taskIds.has(e.taskId)) return true;
    if (e.notes && e.notes.includes(stage.name)) return true;
    if (e.action === "created" && stage.stageNumber === 1) return true;
    return false;
  });
}

export function getStageCompletedAt(timeline: TimelineEntry[], stageName: string): string | null {
  for (const entry of timeline) {
    if (entry.action === "stage_advanced" && entry.notes?.includes(stageName) && entry.createdAt) {
      return entry.createdAt;
    }
  }
  for (const entry of timeline) {
    if (entry.action === "completed" && entry.notes?.includes(stageName) && entry.createdAt) {
      return entry.createdAt;
    }
  }
  return null;
}

export function getStageDefinition(
  tasks: WorkflowTaskJson[],
  nodeData: Record<string, unknown> | null
): WorkflowStageJson | null {
  return tasks[0]?.stage ?? null;
}

export function buildStageChecklist(
  tasks: WorkflowTaskJson[],
  nodeData: Record<string, unknown> | null,
  stageDefinition: WorkflowStageJson | null
): ChecklistRow[] {
  const rows: ChecklistRow[] = [];

  for (const task of tasks) {
    for (const item of task.checklist ?? []) {
      const templateItem = stageDefinition?.checklist?.find((c) => c.id === item.checklistItemId);
      rows.push({
        id: `${task.id}-${item.checklistItemId}`,
        label: item.label ?? templateItem?.label ?? "—",
        isRequired: templateItem?.isRequired ?? false,
        isCompleted: item.isCompleted,
        taskNumber: tasks.length > 1 ? task.taskNumber : undefined
      });
    }
  }

  if (rows.length > 0) return rows;

  const nodeChecklist = (nodeData?.checklist as { label: string; isRequired?: boolean }[] | undefined) ?? [];
  const stageChecklist = stageDefinition?.checklist ?? [];

  const template = stageChecklist.length > 0 ? stageChecklist : nodeChecklist.map((c, i) => ({
    id: i,
    label: c.label,
    isRequired: c.isRequired ?? false
  }));

  return template.map((item) => ({
    id: `tpl-${item.id}`,
    label: item.label,
    isRequired: item.isRequired ?? false,
    isCompleted: false
  }));
}

export function getDirectStageTransitions(graph: WorkflowGraphJson, stageId: number) {
  return graph.transitions
    .filter((t) => t.fromStageId === stageId)
    .map((t) => {
      const targetStage = graph.stageStates.find((s) => s.id === t.toStageId);
      return {
        label: t.label ?? null,
        conditionType: t.conditionType,
        targetName: targetStage?.name ?? `مرحلة #${t.toStageId}`
      };
    });
}

export function sortStagesByNumber(stages: StageProgress[]): StageProgress[] {
  return [...stages].sort((a, b) => (a.stageNumber ?? 0) - (b.stageNumber ?? 0));
}

export function formatMinutes(minutes?: number | null): string | null {
  if (minutes == null || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} د`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} س ${rest} د` : `${hours} س`;
}

export function formatDateTime(value?: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleString("ar", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function formatRelativeTime(value?: string | null): string | null {
  if (!value) return null;
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "الآن";
  if (diffMin < 60) return `منذ ${diffMin} د`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 48) return `منذ ${diffHours} س`;
  const diffDays = Math.round(diffHours / 24);
  return `منذ ${diffDays} ي`;
}
