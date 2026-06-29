import {
  DIRECT_TASK_CATEGORY_LABELS,
  DIRECT_TASK_PRIORITY_LABELS,
  DIRECT_TASK_TYPE_LABELS
} from "@/features/direct-tasks/create/create-direct-task-labels";

export const DIRECT_TASK_STATUS_LABELS: Record<string, string> = {
  draft: "مسودة",
  pending: "معلقة",
  assigned: "مسندة",
  accepted: "مقبولة",
  in_progress: "جارية",
  waiting_review: "بانتظار المراجعة",
  approved: "معتمدة",
  completed: "مكتملة",
  rejected: "مرفوضة",
  cancelled: "ملغاة",
  overdue: "متأخرة"
};

export function statusTone(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
  switch (status) {
    case "in_progress":
    case "accepted":
      return "success";
    case "waiting_review":
    case "assigned":
      return "info";
    case "overdue":
    case "rejected":
      return "danger";
    case "completed":
    case "approved":
      return "success";
    default:
      return "neutral";
  }
}

export function priorityTone(priority: string): "danger" | "warning" | "neutral" {
  switch (priority) {
    case "urgent":
    case "high":
      return "danger";
    case "normal":
      return "warning";
    default:
      return "neutral";
  }
}

export function formatExecutionWindow(startDate?: string | null, executionTime?: string | null, minutes?: number | null): string {
  const date = startDate ? new Date(startDate).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" }) : "اليوم";
  const time = (executionTime ?? "08:00").slice(0, 5);
  if (minutes) {
    const [h, m] = time.split(":").map(Number);
    const end = new Date();
    end.setHours(h, m + minutes, 0, 0);
    const endTime = end.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
    return `${date} ${time} - ${endTime}`;
  }
  return `${date} ${time}`;
}

export function formatRelativeTime(iso?: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  return new Date(iso).toLocaleString("ar-EG");
}

export function categoryLabel(category: string): string {
  return DIRECT_TASK_CATEGORY_LABELS[category] ?? category;
}

export function priorityLabel(priority: string): string {
  return DIRECT_TASK_PRIORITY_LABELS[priority] ?? priority;
}

export function typeLabel(taskType: string): string {
  return DIRECT_TASK_TYPE_LABELS[taskType] ?? taskType;
}

export function statusLabel(status: string): string {
  return DIRECT_TASK_STATUS_LABELS[status] ?? status;
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]).join("");
}

export function isImageAttachment(mimeType?: string | null, fileName?: string): boolean {
  if (mimeType?.startsWith("image/")) return true;
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(fileName ?? "");
}
