"use client";

import {
  AlarmClock,
  CalendarDays,
  CalendarRange,
  Play,
  Zap,
  type LucideIcon
} from "lucide-react";

import { DIRECT_TASK_TYPE_LABELS } from "@/features/direct-tasks/create/create-direct-task-labels";
import type { CreateDirectTaskFormValues } from "@/features/direct-tasks/create/create-direct-task-schema";
import { cn } from "@/lib/utils";

const TYPES: { id: CreateDirectTaskFormValues["taskType"]; icon: LucideIcon; tone: string }[] = [
  { id: "direct", icon: Play, tone: "border-zinc-200 hover:border-atlas-brand" },
  { id: "immediate", icon: Zap, tone: "border-zinc-200 hover:border-amber-400" },
  { id: "emergency", icon: AlarmClock, tone: "border-red-200 hover:border-red-500 text-red-600" },
  { id: "daily", icon: CalendarDays, tone: "border-zinc-200 hover:border-blue-500" },
  { id: "weekly", icon: CalendarRange, tone: "border-zinc-200 hover:border-violet-500" },
  { id: "monthly", icon: CalendarDays, tone: "border-zinc-200 hover:border-emerald-500" }
];

type Props = {
  value: CreateDirectTaskFormValues["taskType"];
  onChange: (value: CreateDirectTaskFormValues["taskType"]) => void;
};

export function TaskTypeSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {TYPES.map((t) => {
        const Icon = t.icon;
        const selected = value === t.id;
        const emergency = t.id === "emergency";
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 bg-white px-3 py-4 text-center transition dark:bg-zinc-900",
              t.tone,
              selected && (emergency ? "border-red-500 bg-red-50 ring-2 ring-red-200" : "border-atlas-brand bg-atlas-brand/5 ring-2 ring-atlas-brand/20"),
              emergency && !selected && "text-red-600"
            )}
          >
            <Icon className={cn("h-6 w-6", selected && !emergency && "text-atlas-brand")} />
            <span className="text-sm font-semibold">{DIRECT_TASK_TYPE_LABELS[t.id]}</span>
          </button>
        );
      })}
    </div>
  );
}
