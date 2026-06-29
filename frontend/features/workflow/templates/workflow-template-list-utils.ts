import type { WorkflowTemplateJson } from "@/lib/api/workflow-client";
import {
  getTemplateReadiness,
  TEMPLATE_READINESS_LABELS,
  type TemplateReadiness
} from "@/features/workflow/templates/workflow-template-status";
import { WORKFLOW_CATEGORY_LABELS, WORKFLOW_PRIORITY_LABELS } from "@/features/workflow/workflow-labels";

export type TemplateListFilter = "all" | TemplateReadiness | "active_only";

export type TemplateSummary = {
  total: number;
  active: number;
  ready: number;
  needsPublish: number;
  inactive: number;
};

export function summarizeTemplates(rows: WorkflowTemplateJson[]): TemplateSummary {
  let active = 0;
  let ready = 0;
  let needsPublish = 0;
  let inactive = 0;

  for (const row of rows) {
    const readiness = getTemplateReadiness(row);
    if (row.isActive) active++;
    if (readiness === "ready") ready++;
    if (readiness === "needs_publish") needsPublish++;
    if (readiness === "inactive") inactive++;
  }

  return { total: rows.length, active, ready, needsPublish, inactive };
}

export function templateReadinessLabel(template: WorkflowTemplateJson): string {
  return TEMPLATE_READINESS_LABELS[getTemplateReadiness(template)];
}

export function templateCategoryLabel(category: string): string {
  return WORKFLOW_CATEGORY_LABELS[category] ?? category;
}

export function templatePriorityLabel(priority: string): string {
  return WORKFLOW_PRIORITY_LABELS[priority] ?? priority;
}

export function matchesTemplateSearch(row: WorkflowTemplateJson, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    row.code,
    row.name,
    row.description,
    templateCategoryLabel(row.category),
    templateReadinessLabel(row),
    templatePriorityLabel(row.defaultPriority),
    row.department?.name
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export function matchesTemplateFilter(row: WorkflowTemplateJson, filter: TemplateListFilter): boolean {
  if (filter === "all") return true;
  if (filter === "active_only") return row.isActive;
  return getTemplateReadiness(row) === filter;
}

export function matchesTemplateCategory(row: WorkflowTemplateJson, category: string): boolean {
  if (category === "all") return true;
  return row.category === category;
}

export const TEMPLATE_LIST_FILTERS: { id: TemplateListFilter; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "ready", label: "جاهز" },
  { id: "needs_publish", label: "بانتظار النشر" },
  { id: "inactive", label: "غير نشط" }
];

export function readinessBadgeVariant(
  readiness: TemplateReadiness
): "success" | "warning" | "secondary" {
  switch (readiness) {
    case "ready":
      return "success";
    case "needs_publish":
      return "warning";
    default:
      return "secondary";
  }
}
