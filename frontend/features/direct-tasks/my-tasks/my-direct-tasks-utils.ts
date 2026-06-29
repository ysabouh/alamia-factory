import type { DirectTaskJson } from "@/lib/api/direct-tasks-client";

export type MyDirectTasksTab = "all" | "active" | "review" | "overdue" | "completed";

export type MyDirectTasksSort = "newest" | "oldest" | "due" | "priority";

export type MyDirectTasksSummary = {
  total: number;
  active: number;
  review: number;
  overdue: number;
  completed: number;
  completedThisMonth: number;
  needsAttentionToday: number;
  todayTotal: number;
  todayCompleted: number;
  todayRemaining: number;
  todayPercent: number;
};

const ACTIVE_STATUSES = new Set(["assigned", "accepted", "in_progress", "pending"]);
const COMPLETED_STATUSES = new Set(["completed", "approved"]);
const REVIEW_STATUSES = new Set(["waiting_review"]);

export function isTaskOverdue(task: DirectTaskJson): boolean {
  if (task.isOverdue) return true;
  if (COMPLETED_STATUSES.has(task.status) || task.status === "cancelled") return false;
  if (!task.dueAt) return false;
  return new Date(task.dueAt).getTime() < Date.now();
}

export function isTaskActive(task: DirectTaskJson): boolean {
  return ACTIVE_STATUSES.has(task.status) || task.status === "in_progress";
}

export function isTaskCompleted(task: DirectTaskJson): boolean {
  return COMPLETED_STATUSES.has(task.status);
}

export function isTaskInReview(task: DirectTaskJson): boolean {
  return REVIEW_STATUSES.has(task.status);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function taskScheduledForDay(task: DirectTaskJson, day: Date): boolean {
  if (task.startDate) {
    const start = new Date(task.startDate);
    if (isSameDay(start, day)) return true;
  }
  if (task.dueAt) {
    const due = new Date(task.dueAt);
    if (isSameDay(due, day)) return true;
  }
  return false;
}

function isCompletedThisMonth(task: DirectTaskJson): boolean {
  if (!task.completedAt) return false;
  const completed = new Date(task.completedAt);
  const now = new Date();
  return completed.getFullYear() === now.getFullYear() && completed.getMonth() === now.getMonth();
}

export function computeMyDirectTasksSummary(tasks: DirectTaskJson[]): MyDirectTasksSummary {
  const today = new Date();
  const todayTasks = tasks.filter((t) => taskScheduledForDay(t, today) && !isTaskCompleted(t));
  const todayCompleted = tasks.filter((t) => taskScheduledForDay(t, today) && isTaskCompleted(t));

  const overdue = tasks.filter(isTaskOverdue).length;
  const needsAttentionToday = tasks.filter((t) => {
    if (isTaskCompleted(t)) return false;
    if (isTaskOverdue(t)) return true;
    if (taskScheduledForDay(t, today)) return true;
    return false;
  }).length;

  const todayTotal = todayTasks.length + todayCompleted.length;
  const todayPercent = todayTotal > 0 ? Math.round((todayCompleted.length / todayTotal) * 100) : 0;

  return {
    total: tasks.length,
    active: tasks.filter(isTaskActive).length,
    review: tasks.filter(isTaskInReview).length,
    overdue,
    completed: tasks.filter(isTaskCompleted).length,
    completedThisMonth: tasks.filter(isCompletedThisMonth).length,
    needsAttentionToday,
    todayTotal,
    todayCompleted: todayCompleted.length,
    todayRemaining: todayTasks.length,
    todayPercent
  };
}

export function filterMyDirectTasks(
  tasks: DirectTaskJson[],
  tab: MyDirectTasksTab,
  search: string,
  statusFilter: string,
  priorityFilter: string,
  typeFilter: string,
  categoryFilter = ""
): DirectTaskJson[] {
  const q = search.trim().toLowerCase();

  return tasks.filter((task) => {
    if (tab === "active" && !isTaskActive(task)) return false;
    if (tab === "review" && !isTaskInReview(task)) return false;
    if (tab === "overdue" && !isTaskOverdue(task)) return false;
    if (tab === "completed" && !isTaskCompleted(task)) return false;
    if (statusFilter && task.status !== statusFilter) return false;
    if (priorityFilter && task.priority !== priorityFilter) return false;
    if (typeFilter && task.taskType !== typeFilter) return false;
    if (categoryFilter && task.category !== categoryFilter) return false;
    if (!q) return true;
    const hay = `${task.title} ${task.taskNumber} ${task.description ?? ""}`.toLowerCase();
    return hay.includes(q);
  });
}

const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

export function sortMyDirectTasks(tasks: DirectTaskJson[], sort: MyDirectTasksSort): DirectTaskJson[] {
  const rows = [...tasks];
  switch (sort) {
    case "oldest":
      return rows.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
    case "due":
      return rows.sort((a, b) => {
        const ad = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        const bd = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        return ad - bd;
      });
    case "priority":
      return rows.sort((a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9));
    default:
      return rows.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  }
}

export function formatTaskDeadline(task: DirectTaskJson): { text: string; tone: "danger" | "warning" | "neutral" } {
  if (isTaskOverdue(task)) {
    const ref = task.dueAt ?? task.updatedAt ?? task.createdAt;
    if (ref) {
      const diff = Date.now() - new Date(ref).getTime();
      const hours = Math.max(1, Math.floor(diff / 3600000));
      if (hours < 24) return { text: `متأخرة منذ ${hours} ساعة`, tone: "danger" };
      const days = Math.floor(hours / 24);
      return { text: `متأخرة منذ ${days} يوم`, tone: "danger" };
    }
    return { text: "متأخرة", tone: "danger" };
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const timeFrom = (iso?: string | null, fallback?: string | null) => {
    if (iso) return new Date(iso).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    if (fallback) return fallback.slice(0, 5);
    return "";
  };

  if (task.dueAt) {
    const due = new Date(task.dueAt);
    const time = timeFrom(task.dueAt, task.executionTime);
    if (isSameDay(due, now)) return { text: `اليوم ${time}`, tone: "warning" };
    if (isSameDay(due, tomorrow)) return { text: `غداً ${time}`, tone: "neutral" };
    const date = due.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
    return { text: `${date} · ${time}`, tone: "neutral" };
  }

  if (task.startDate) {
    const start = new Date(task.startDate);
    const time = task.executionTime?.slice(0, 5) ?? "";
    if (isSameDay(start, now)) return { text: `اليوم ${time}`, tone: "warning" };
    if (isSameDay(start, tomorrow)) return { text: `غداً ${time}`, tone: "neutral" };
    const date = start.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
    return { text: `${date} · ${time}`, tone: "neutral" };
  }

  return { text: "بدون موعد", tone: "neutral" };
}

export function categoryTone(category: string): string {
  switch (category) {
    case "electrical_maintenance":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "mechanical_maintenance":
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
    case "safety":
      return "bg-violet-100 text-violet-800 border-violet-200";
    case "production":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "quality":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "warehouse":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function priorityDisplay(priority: string): { label: string; className: string; icon: "fire" | "up" | "down" } {
  switch (priority) {
    case "urgent":
    case "high":
      return { label: "عالية", className: "text-red-600", icon: "fire" };
    case "normal":
      return { label: "متوسطة", className: "text-amber-600", icon: "up" };
    default:
      return { label: "منخفضة", className: "text-zinc-500", icon: "down" };
  }
}

export type ScheduleEntry = {
  id: number;
  time: string;
  title: string;
  status: "overdue" | "active" | "upcoming" | "done";
  statusLabel: string;
};

export function buildTodaySchedule(tasks: DirectTaskJson[]): ScheduleEntry[] {
  const today = new Date();
  const entries: ScheduleEntry[] = [];

  for (const task of tasks) {
    if (!taskScheduledForDay(task, today)) continue;
    const time = task.executionTime?.slice(0, 5) ?? (task.dueAt ? new Date(task.dueAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }) : "—");
    let status: ScheduleEntry["status"] = "upcoming";
    let statusLabel = "قادمة";
    if (isTaskCompleted(task)) {
      status = "done";
      statusLabel = "مكتملة";
    } else if (isTaskOverdue(task)) {
      status = "overdue";
      statusLabel = "متأخرة";
    } else if (isTaskActive(task)) {
      status = "active";
      statusLabel = "جارية";
    }
    entries.push({ id: task.id, time, title: task.title, status, statusLabel });
  }

  return entries.sort((a, b) => a.time.localeCompare(b.time));
}

export const MY_DIRECT_TASKS_TAB_LABELS: Record<MyDirectTasksTab, string> = {
  all: "الكل",
  active: "جارية",
  review: "قيد المراجعة",
  overdue: "متأخرة",
  completed: "مكتملة"
};
