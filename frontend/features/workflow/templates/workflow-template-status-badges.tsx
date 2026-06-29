import type { ReactNode } from "react";

import {
  getTemplateReadiness,
  TEMPLATE_READINESS_LABELS,
  type TemplateReadiness
} from "@/features/workflow/templates/workflow-template-status";
import type { WorkflowTemplateJson } from "@/lib/api/workflow-client";

const readinessClass: Record<TemplateReadiness, string> = {
  ready: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800",
  needs_publish: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-800",
  inactive: "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700"
};

function Badge({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${className}`}>
      {children}
    </span>
  );
}

export function WorkflowTemplateStatusBadges({ template }: { template: WorkflowTemplateJson }) {
  const readiness = getTemplateReadiness(template);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge
        className={
          template.isActive
            ? "bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950/50 dark:text-sky-200 dark:ring-sky-800"
            : "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700"
        }
      >
        {template.isActive ? "نشط" : "غير نشط"}
      </Badge>
      <Badge className={readinessClass[readiness]}>{TEMPLATE_READINESS_LABELS[readiness]}</Badge>
      {template.publishedVersion ? (
        <Badge className="bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-200 dark:ring-violet-800">
          منشور v{template.publishedVersion.version}
        </Badge>
      ) : null}
    </div>
  );
}
