import type { WorkflowInstanceJson } from "@/lib/api/workflow-client";
import { WORKFLOW_PRIORITY_LABELS, WORKFLOW_STATUS_LABELS } from "@/features/workflow/workflow-labels";

export type InstanceStatusFilter = "all" | "active" | "waiting_approval" | "completed";

const ACTIVE_STATUSES = new Set([
  "pending",
  "assigned",
  "accepted",
  "in_progress",
  "waiting_information",
  "waiting_approval"
]);

export function instanceStatusLabel(status: string): string {
  return WORKFLOW_STATUS_LABELS[status] ?? status;
}

export function instancePriorityLabel(priority: string): string {
  return WORKFLOW_PRIORITY_LABELS[priority] ?? priority;
}

export function instanceStatusBadgeVariant(
  status: string
): "success" | "info" | "warning" | "destructive" | "secondary" | "outline" {
  switch (status) {
    case "completed":
      return "success";
    case "waiting_approval":
      return "warning";
    case "waiting_information":
    case "in_progress":
    case "assigned":
    case "accepted":
      return "info";
    case "rejected":
    case "cancelled":
    case "overdue":
      return "destructive";
    default:
      return "secondary";
  }
}

export function instancePriorityBadgeVariant(
  priority: string
): "destructive" | "warning" | "secondary" | "outline" {
  switch (priority) {
    case "urgent":
      return "destructive";
    case "high":
      return "warning";
    case "low":
      return "outline";
    default:
      return "secondary";
  }
}

export function formatInstanceDate(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("ar", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

export function formatInstanceDateTime(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("ar", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function matchesInstanceSearch(row: WorkflowInstanceJson, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    row.workflowNumber,
    row.templateName,
    row.subject?.label,
    row.subject?.code,
    row.currentStage?.name,
    instanceStatusLabel(row.status),
    instancePriorityLabel(row.priority)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export function matchesInstanceFilter(row: WorkflowInstanceJson, filter: InstanceStatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "completed") return row.status === "completed";
  if (filter === "waiting_approval") return row.status === "waiting_approval";
  if (filter === "active") return ACTIVE_STATUSES.has(row.status) && row.status !== "completed";
  return true;
}

export function summarizeInstances(rows: WorkflowInstanceJson[]) {
  const total = rows.length;
  const active = rows.filter((r) => ACTIVE_STATUSES.has(r.status) && r.status !== "completed").length;
  const waitingApproval = rows.filter((r) => r.status === "waiting_approval").length;
  const completed = rows.filter((r) => r.status === "completed").length;
  return { total, active, waitingApproval, completed };
}

export const INSTANCE_STATUS_FILTERS: { id: InstanceStatusFilter; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "active", label: "جارية" },
  { id: "waiting_approval", label: "بانتظار الموافقة" },
  { id: "completed", label: "مكتملة" }
];
