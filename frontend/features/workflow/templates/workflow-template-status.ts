import type { WorkflowTemplateJson } from "@/lib/api/workflow-client";

export type TemplateReadiness = "ready" | "needs_publish" | "inactive";

export function canStartTemplate(t: WorkflowTemplateJson): boolean {
  if (!t.isActive || !t.publishedVersionId) return false;
  const stages = t.publishedVersion?.stages;
  if (stages) return stages.length > 0;
  return true;
}

export function getTemplateReadiness(t: WorkflowTemplateJson): TemplateReadiness {
  if (!t.isActive) return "inactive";
  if (!t.publishedVersionId) return "needs_publish";
  return "ready";
}

export const TEMPLATE_READINESS_LABELS: Record<TemplateReadiness, string> = {
  ready: "جاهز للتنفيذ",
  needs_publish: "بانتظار النشر",
  inactive: "مؤرشف / غير نشط"
};

export const TEMPLATE_READINESS_HINTS: Record<TemplateReadiness, string> = {
  ready: "القالب نشط وله نسخة منشورة — يمكن بدء التنفيذ.",
  needs_publish: "صمّم المراحل في المصمم ثم انشر النسخة لتفعيل التنفيذ.",
  inactive: "القالب غير نشط. فعّله من المفتاح أدناه أو عبر «تعديل البيانات»."
};
