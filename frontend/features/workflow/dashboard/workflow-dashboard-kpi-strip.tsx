"use client";

import {
  AlertTriangle,
  Check,
  Clock,
  ListTodo,
  Play,
  ShieldCheck,
  Workflow,
  type LucideIcon
} from "lucide-react";

import type { WorkflowDashboardJson } from "@/lib/api/workflow-client";

type KpiItem = {
  label: string;
  subtitle: string;
  value: string | number;
  icon: LucideIcon;
  iconClass: string;
  ringClass: string;
  titleClass: string;
  valueClass: string;
  strokeWidth?: number;
};

function SectionDivider({ orientation }: { orientation: "vertical" | "horizontal" }) {
  if (orientation === "vertical") {
    return (
      <>
        <div className="hidden w-px shrink-0 self-stretch bg-zinc-200 lg:block dark:bg-zinc-700" aria-hidden />
        <div className="h-px w-full shrink-0 bg-zinc-200 lg:hidden dark:bg-zinc-700" aria-hidden />
      </>
    );
  }
  return <div className="h-px w-full shrink-0 bg-zinc-200 dark:bg-zinc-700" aria-hidden />;
}

function KpiRow({ items }: { items: KpiItem[] }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-stretch lg:overflow-x-auto">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="flex min-w-[130px] flex-1 flex-col lg:flex-row">
            {index > 0 ? <SectionDivider orientation="vertical" /> : null}
            <div className="flex min-w-[130px] flex-1 flex-col items-center justify-center px-3 py-5 text-center">
              <div className="mb-2 flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-zinc-900 ${item.ringClass}`}
                >
                  <Icon className={`h-4 w-4 ${item.iconClass}`} strokeWidth={item.strokeWidth ?? 2} />
                </div>
                <span className={`text-sm font-semibold ${item.titleClass}`}>{item.label}</span>
              </div>
              <span className={`text-3xl font-bold leading-none ${item.valueClass}`}>{item.value}</span>
              <span className="mt-1.5 text-xs text-zinc-500">{item.subtitle}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function buildWorkflowItems(data: WorkflowDashboardJson): KpiItem[] {
  return [
    {
      label: "إجمالي سير العمل",
      subtitle: "جميع التنفيذات",
      value: data.totalWorkflows,
      icon: Workflow,
      iconClass: "text-zinc-500",
      ringClass: "border-2 border-zinc-400",
      titleClass: "text-zinc-600 dark:text-zinc-300",
      valueClass: "text-zinc-700 dark:text-zinc-200"
    },
    {
      label: "نشط",
      subtitle: "قيد التنفيذ",
      value: data.activeWorkflows,
      icon: Play,
      iconClass: "text-blue-500",
      ringClass: "border-2 border-blue-500",
      titleClass: "text-blue-600",
      valueClass: "text-blue-600"
    },
    {
      label: "مكتمل",
      subtitle: "انتهى بنجاح",
      value: data.completedWorkflows,
      icon: Check,
      iconClass: "text-emerald-500",
      ringClass: "border-2 border-emerald-500",
      titleClass: "text-emerald-600",
      valueClass: "text-emerald-600",
      strokeWidth: 2.5
    },
    {
      label: "متأخر",
      subtitle: "تجاوز الموعد",
      value: data.delayedWorkflows,
      icon: AlertTriangle,
      iconClass: "text-orange-500",
      ringClass: "border-2 border-orange-500",
      titleClass: "text-orange-600",
      valueClass: "text-orange-600"
    }
  ];
}

function buildPerformanceItems(data: WorkflowDashboardJson): KpiItem[] {
  return [
    {
      label: "مهام مفتوحة",
      subtitle: "تحتاج متابعة",
      value: data.openTasks,
      icon: ListTodo,
      iconClass: "text-sky-500",
      ringClass: "border-2 border-sky-500",
      titleClass: "text-sky-600",
      valueClass: "text-sky-600"
    },
    {
      label: "مهام مغلقة",
      subtitle: "تم إنجازها",
      value: data.closedTasks,
      icon: Check,
      iconClass: "text-emerald-500",
      ringClass: "border-2 border-emerald-500",
      titleClass: "text-emerald-600",
      valueClass: "text-emerald-600",
      strokeWidth: 2.5
    },
    {
      label: "الالتزام بـ SLA",
      subtitle: "نسبة الالتزام",
      value: `${data.slaCompliancePercent}%`,
      icon: ShieldCheck,
      iconClass: "text-violet-500",
      ringClass: "border-2 border-violet-500",
      titleClass: "text-violet-600",
      valueClass: "text-violet-600"
    },
    {
      label: "متوسط الإكمال",
      subtitle: "بالدقائق",
      value: data.averageCompletionMinutes,
      icon: Clock,
      iconClass: "text-amber-500",
      ringClass: "border-2 border-amber-500",
      titleClass: "text-amber-600",
      valueClass: "text-amber-600"
    }
  ];
}

export function WorkflowDashboardKpiStrip({ data }: { data: WorkflowDashboardJson }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <KpiRow items={buildWorkflowItems(data)} />
      <SectionDivider orientation="horizontal" />
      <KpiRow items={buildPerformanceItems(data)} />
    </div>
  );
}
