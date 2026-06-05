import type { OperationType, RoutingFlowStep } from "@/lib/api/routing-client";

export const operationTypeLabels: Record<OperationType, string> = {
  injection: "حقن",
  blow: "نفخ",
  compression: "ضغط",
  assembly: "تجميع",
  packaging: "تغليف",
  labeling: "لصق ملصقات",
  inspection: "فحص",
  cooling: "تبريد",
  trimming: "تشذيب",
  printing: "طباعة"
};

export const manufacturingModeLabels: Record<string, string> = {
  manufactured: "مصنّع",
  assembled: "مجمّع",
  hybrid: "هجين",
  purchased: "مشترى"
};

export function operationTypeBadgeColor(type: OperationType): string {
  if (type === "injection" || type === "blow" || type === "compression") return "bg-blue-500/15 text-blue-700 dark:text-blue-300";
  if (type === "assembly") return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
  if (type === "packaging" || type === "labeling") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  return "bg-muted text-muted-foreground";
}

export function flowStepLabel(step: RoutingFlowStep): string {
  if (step.kind === "materials") return step.label;
  return operationTypeLabels[step.operationType] ?? step.label;
}
