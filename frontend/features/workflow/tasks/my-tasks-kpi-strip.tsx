"use client";

import { AlertTriangle, Check, Flame, ListTodo, Play, Timer, type LucideIcon } from "lucide-react";

import type { MyTasksKpiFilter, MyTasksSummary } from "@/features/workflow/tasks/my-tasks-utils";

type Props = {
  summary: MyTasksSummary;
  activeFilter: MyTasksKpiFilter;
  onFilterChange: (filter: MyTasksKpiFilter) => void;
};

type KpiItem = {
  id: MyTasksKpiFilter;
  label: string;
  subtitle: string;
  value: number;
  icon: LucideIcon;
  iconClass: string;
  ringClass: string;
  titleClass: string;
  valueClass: string;
};

function SectionDivider() {
  return (
    <>
      <div className="hidden w-px shrink-0 self-stretch bg-zinc-200 lg:block dark:bg-zinc-700" aria-hidden />
      <div className="h-px w-full shrink-0 bg-zinc-200 lg:hidden dark:bg-zinc-700" aria-hidden />
    </>
  );
}

export function MyTasksKpiStrip({ summary, activeFilter, onFilterChange }: Props) {
  const items: KpiItem[] = [
    {
      id: "all",
      label: "إجمالي المهام",
      subtitle: "جميع المهام",
      value: summary.total,
      icon: ListTodo,
      iconClass: "text-zinc-500",
      ringClass: "border-2 border-zinc-400",
      titleClass: "text-zinc-600 dark:text-zinc-300",
      valueClass: "text-zinc-700 dark:text-zinc-200"
    },
    {
      id: "urgent",
      label: "عاجلة",
      subtitle: "أولوية مرتفعة",
      value: summary.urgent,
      icon: Flame,
      iconClass: "text-red-500",
      ringClass: "border-2 border-red-500",
      titleClass: "text-red-600",
      valueClass: "text-red-600"
    },
    {
      id: "due_today",
      label: "مستحقة اليوم",
      subtitle: "تنتهي اليوم",
      value: summary.dueToday,
      icon: Timer,
      iconClass: "text-amber-500",
      ringClass: "border-2 border-amber-500",
      titleClass: "text-amber-600",
      valueClass: "text-amber-600"
    },
    {
      id: "active",
      label: "نشطة",
      subtitle: "قيد التنفيذ",
      value: summary.active,
      icon: Play,
      iconClass: "text-blue-500",
      ringClass: "border-2 border-blue-500",
      titleClass: "text-blue-600",
      valueClass: "text-blue-600"
    },
    {
      id: "overdue",
      label: "متأخرة",
      subtitle: "تجاوزت الموعد",
      value: summary.overdue,
      icon: AlertTriangle,
      iconClass: "text-orange-500",
      ringClass: "border-2 border-orange-500",
      titleClass: "text-orange-600",
      valueClass: "text-orange-600"
    },
    {
      id: "completed",
      label: "مكتملة",
      subtitle: "انتهت بنجاح",
      value: summary.completed,
      icon: Check,
      iconClass: "text-emerald-500",
      ringClass: "border-2 border-emerald-500",
      titleClass: "text-emerald-600",
      valueClass: "text-emerald-600"
    }
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-col lg:flex-row lg:items-stretch lg:overflow-x-auto">
        {items.map((item, index) => {
          const Icon = item.icon;
          const selected = activeFilter === item.id;

          return (
            <div key={item.id} className="flex min-w-[130px] flex-1 flex-col lg:flex-row">
              {index > 0 ? <SectionDivider /> : null}
              <button
                type="button"
                onClick={() => onFilterChange(selected ? "all" : item.id)}
                className={`flex min-w-[130px] flex-1 flex-col items-center justify-center px-3 py-5 text-center transition ${
                  selected ? "bg-atlas-brand/5 dark:bg-atlas-brand/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-zinc-900 ${item.ringClass}`}
                  >
                    <Icon className={`h-4 w-4 ${item.iconClass}`} strokeWidth={item.id === "completed" ? 2.5 : 2} />
                  </div>
                  <span className={`text-sm font-semibold ${item.titleClass}`}>{item.label}</span>
                </div>
                <span className={`text-3xl font-bold leading-none ${item.valueClass}`}>{item.value}</span>
                <span className="mt-1.5 text-xs text-zinc-500">{item.subtitle}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
