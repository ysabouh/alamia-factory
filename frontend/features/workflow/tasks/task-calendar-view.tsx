"use client";

import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { WorkflowTaskJson } from "@/lib/api/workflow-client";

type Props = {
  tasks: WorkflowTaskJson[];
  onSelect: (t: WorkflowTaskJson) => void;
};

export function TaskCalendarView({ tasks, onSelect }: Props) {
  const [month, setMonth] = useState(dayjs());

  const days = useMemo(() => {
    const start = month.startOf("month").startOf("week");
    const end = month.endOf("month").endOf("week");
    const out: dayjs.Dayjs[] = [];
    let d = start;
    while (d.isBefore(end) || d.isSame(end, "day")) {
      out.push(d);
      d = d.add(1, "day");
    }
    return out;
  }, [month]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, WorkflowTaskJson[]>();
    for (const t of tasks) {
      if (!t.dueAt) continue;
      const key = dayjs(t.dueAt).format("YYYY-MM-DD");
      map.set(key, [...(map.get(key) ?? []), t]);
    }
    return map;
  }, [tasks]);

  return (
    <div className="rounded-lg border border-atlas-border bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => setMonth((m) => m.subtract(1, "month"))} className="p-1">
          <ChevronRight className="h-5 w-5" />
        </button>
        <h3 className="font-bold">{month.format("MMMM YYYY")}</h3>
        <button type="button" onClick={() => setMonth((m) => m.add(1, "month"))} className="p-1">
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-atlas-muted">
        {["س", "ح", "ن", "ث", "ر", "خ", "ج"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = d.format("YYYY-MM-DD");
          const dayTasks = tasksByDay.get(key) ?? [];
          const inMonth = d.month() === month.month();
          return (
            <div
              key={key}
              className={`min-h-[72px] rounded border p-1 text-[10px] ${
                inMonth ? "border-atlas-border dark:border-zinc-700" : "border-transparent opacity-40"
              }`}
            >
              <div className="font-semibold">{d.date()}</div>
              {dayTasks.slice(0, 2).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelect(t)}
                  className="mt-0.5 block w-full truncate rounded bg-atlas-brand/10 px-0.5 text-start text-[9px] text-atlas-brand"
                >
                  {t.taskNumber}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
