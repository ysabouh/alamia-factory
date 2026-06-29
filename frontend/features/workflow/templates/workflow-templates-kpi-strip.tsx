"use client";

import { Archive, Check, Layers, Play, Timer, type LucideIcon } from "lucide-react";

import type { TemplateListFilter, TemplateSummary } from "@/features/workflow/templates/workflow-template-list-utils";

type Props = {
  summary: TemplateSummary;
  activeFilter: TemplateListFilter;
  onFilterChange: (filter: TemplateListFilter) => void;
};

type KpiItem = {
  id: TemplateListFilter;
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

export function WorkflowTemplatesKpiStrip({ summary, activeFilter, onFilterChange }: Props) {
  const items: KpiItem[] = [
    {
      id: "all",
      label: "إجمالي القوالب",
      subtitle: "جميع القوالب",
      value: summary.total,
      icon: Layers,
      iconClass: "text-zinc-500",
      ringClass: "border-2 border-zinc-400",
      titleClass: "text-zinc-600 dark:text-zinc-300",
      valueClass: "text-zinc-700 dark:text-zinc-200"
    },
    {
      id: "active_only",
      label: "نشط",
      subtitle: "قوالب مفعّلة",
      value: summary.active,
      icon: Play,
      iconClass: "text-blue-500",
      ringClass: "border-2 border-blue-500",
      titleClass: "text-blue-600",
      valueClass: "text-blue-600"
    },
    {
      id: "ready",
      label: "جاهز للتنفيذ",
      subtitle: "منشور وجاهز",
      value: summary.ready,
      icon: Check,
      iconClass: "text-emerald-500",
      ringClass: "border-2 border-emerald-500",
      titleClass: "text-emerald-600",
      valueClass: "text-emerald-600"
    },
    {
      id: "needs_publish",
      label: "بانتظار النشر",
      subtitle: "يحتاج نشراً",
      value: summary.needsPublish,
      icon: Timer,
      iconClass: "text-amber-500",
      ringClass: "border-2 border-amber-500",
      titleClass: "text-amber-600",
      valueClass: "text-amber-600"
    },
    {
      id: "inactive",
      label: "غير نشط",
      subtitle: "مؤرشف / موقوف",
      value: summary.inactive,
      icon: Archive,
      iconClass: "text-zinc-500",
      ringClass: "border-2 border-zinc-400",
      titleClass: "text-zinc-600 dark:text-zinc-300",
      valueClass: "text-zinc-600 dark:text-zinc-300"
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
                    <Icon
                      className={`h-4 w-4 ${item.iconClass}`}
                      strokeWidth={item.id === "ready" ? 2.5 : 2}
                    />
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
