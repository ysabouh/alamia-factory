import type { WorkflowTaskJson } from "@/lib/api/workflow-client";

export type MyTasksTab = "action" | "waiting" | "archive";
export type MyTasksKpiFilter = "all" | "urgent" | "due_today" | "active" | "overdue" | "completed";
export type MyTasksViewMode = "cards" | "kanban" | "calendar";

const ACTION_STATUSES = new Set([
  "pending",
  "assigned",
  "accepted",
  "in_progress",
  "waiting_information"
]);
const WAITING_STATUSES = new Set(["waiting_approval"]);
const ARCHIVE_STATUSES = new Set(["completed", "cancelled", "rejected"]);

export type MyTasksSummary = {
  total: number;
  urgent: number;
  dueToday: number;
  active: number;
  completed: number;
  overdue: number;
  action: number;
  waiting: number;
};

export function computeMyTasksSummary(tasks: WorkflowTaskJson[]): MyTasksSummary {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let urgent = 0;
  let dueToday = 0;
  let active = 0;
  let completed = 0;
  let overdue = 0;
  let action = 0;
  let waiting = 0;

  for (const t of tasks) {
    if (ACTION_STATUSES.has(t.status)) action++;
    if (WAITING_STATUSES.has(t.status)) waiting++;
    if (t.status === "completed") completed++;
    if (t.isOverdue || t.status === "overdue") overdue++;
    if (ACTION_STATUSES.has(t.status) || WAITING_STATUSES.has(t.status)) active++;
    if (t.priority === "urgent" || t.priority === "high") {
      if (!ARCHIVE_STATUSES.has(t.status)) urgent++;
    }
    if (t.dueAt) {
      const due = new Date(t.dueAt);
      if (due >= today && due < tomorrow && !ARCHIVE_STATUSES.has(t.status)) dueToday++;
    }
  }

  return { total: tasks.length, urgent, dueToday, active, completed, overdue, action, waiting };
}

function matchesTab(task: WorkflowTaskJson, tab: MyTasksTab): boolean {
  if (tab === "action") return ACTION_STATUSES.has(task.status);
  if (tab === "waiting") return WAITING_STATUSES.has(task.status);
  return ARCHIVE_STATUSES.has(task.status);
}

function matchesKpi(task: WorkflowTaskJson, kpi: MyTasksKpiFilter): boolean {
  if (kpi === "all") return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  switch (kpi) {
    case "urgent":
      return (task.priority === "urgent" || task.priority === "high") && !ARCHIVE_STATUSES.has(task.status);
    case "due_today":
      if (!task.dueAt || ARCHIVE_STATUSES.has(task.status)) return false;
      const due = new Date(task.dueAt);
      return due >= today && due < tomorrow;
    case "active":
      return ACTION_STATUSES.has(task.status) || WAITING_STATUSES.has(task.status);
    case "overdue":
      return task.isOverdue || task.status === "overdue";
    case "completed":
      return task.status === "completed";
    default:
      return true;
  }
}

function matchesSearch(task: WorkflowTaskJson, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    task.taskNumber,
    task.workflowNumber,
    task.templateName,
    task.stage?.name,
    task.assignee?.name
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function filterMyTasks(
  tasks: WorkflowTaskJson[],
  tab: MyTasksTab,
  search: string,
  kpiFilter: MyTasksKpiFilter
): WorkflowTaskJson[] {
  return tasks.filter(
    (t) => matchesTab(t, tab) && matchesSearch(t, search) && matchesKpi(t, kpiFilter)
  );
}

export type WorkflowTaskGroup = {
  workflowNumber: string;
  templateName?: string | null;
  instanceId: number;
  tasks: WorkflowTaskJson[];
};

export function groupTasksByWorkflow(tasks: WorkflowTaskJson[]): WorkflowTaskGroup[] {
  const map = new Map<number, WorkflowTaskGroup>();
  for (const t of tasks) {
    const existing = map.get(t.instanceId);
    if (existing) {
      existing.tasks.push(t);
      if (!existing.templateName && t.templateName) {
        existing.templateName = t.templateName;
      }
    } else {
      map.set(t.instanceId, {
        instanceId: t.instanceId,
        workflowNumber: t.workflowNumber ?? `#${t.instanceId}`,
        templateName: t.templateName ?? null,
        tasks: [t]
      });
    }
  }
  return [...map.values()].sort((a, b) => b.tasks.length - a.tasks.length);
}

export function checklistProgress(task: WorkflowTaskJson): { done: number; total: number; percent: number } {
  const items = task.checklist ?? [];
  const total = items.length;
  if (total === 0) return { done: 0, total: 0, percent: 0 };
  const done = items.filter((c) => c.isCompleted).length;
  return { done, total, percent: Math.round((done / total) * 100) };
}

export const MY_TASKS_TAB_LABELS: Record<MyTasksTab, string> = {
  action: "تحتاج إجراء",
  waiting: "بانتظار",
  archive: "الأرشيف"
};

export const MY_TASKS_EMPTY: Record<MyTasksTab, string> = {
  action: "لا مهام تحتاج إجراءً — أحسنت!",
  waiting: "لا مهام بانتظار موافقة أو توضيح.",
  archive: "لا مهام مكتملة أو مؤرشفة بعد."
};
