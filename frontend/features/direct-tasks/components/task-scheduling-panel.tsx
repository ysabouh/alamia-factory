"use client";

import { Input } from "@/components/ui/input";
import { formatScheduleSummary, WEEKDAY_LABELS } from "@/features/direct-tasks/create/create-direct-task-labels";
import type { CreateDirectTaskFormValues } from "@/features/direct-tasks/create/create-direct-task-schema";

type Props = {
  taskType: CreateDirectTaskFormValues["taskType"];
  scheduling: CreateDirectTaskFormValues["scheduling"];
  onChange: (scheduling: CreateDirectTaskFormValues["scheduling"]) => void;
};

export function TaskSchedulingPanel({ taskType, scheduling, onChange }: Props) {
  const hideAdvanced = taskType === "immediate" || taskType === "emergency";
  const summary = formatScheduleSummary({ taskType, scheduling });

  if (hideAdvanced) {
    return summary ? (
      <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
        {summary}
      </div>
    ) : null;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!hideAdvanced ? (
          <>
            <div>
              <label className="text-xs text-atlas-muted">تاريخ البدء</label>
              <Input
                type="date"
                className="mt-1"
                value={scheduling.startDate ?? ""}
                onChange={(e) => onChange({ ...scheduling, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-atlas-muted">وقت التنفيذ</label>
              <Input
                type="time"
                className="mt-1"
                value={scheduling.executionTime ?? ""}
                onChange={(e) => onChange({ ...scheduling, executionTime: e.target.value })}
              />
            </div>
          </>
        ) : null}
        <div>
          <label className="text-xs text-atlas-muted">الموعد النهائي</label>
          <Input
            type="datetime-local"
            className="mt-1"
            value={scheduling.dueAt?.slice(0, 16) ?? ""}
            onChange={(e) => onChange({ ...scheduling, dueAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
          />
        </div>
        <div>
          <label className="text-xs text-atlas-muted">المدة المتوقعة (دقيقة)</label>
          <Input
            type="number"
            min={1}
            className="mt-1"
            value={scheduling.expectedDurationMinutes ?? ""}
            onChange={(e) => onChange({ ...scheduling, expectedDurationMinutes: Number(e.target.value) || undefined })}
          />
        </div>
        <div>
          <label className="text-xs text-atlas-muted">تذكير قبل (دقيقة)</label>
          <Input
            type="number"
            min={0}
            className="mt-1"
            value={scheduling.reminderMinutesBefore ?? ""}
            onChange={(e) => onChange({ ...scheduling, reminderMinutesBefore: Number(e.target.value) || undefined })}
          />
        </div>
      </div>

      {taskType === "daily" ? (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-atlas-muted">تكرار كل</label>
            <Input
              type="number"
              min={1}
              className="mt-1 w-24"
              value={scheduling.repeatEvery ?? 1}
              onChange={(e) => onChange({ ...scheduling, repeatEvery: Number(e.target.value) || 1 })}
            />
          </div>
          <span className="pb-2 text-sm text-atlas-muted">يوم</span>
        </div>
      ) : null}

      {taskType === "weekly" ? (
        <div className="flex flex-wrap gap-2">
          {WEEKDAY_LABELS.map((label, day) => {
            const selected = scheduling.weekdays?.includes(day) ?? false;
            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  const current = scheduling.weekdays ?? [];
                  const next = selected ? current.filter((d) => d !== day) : [...current, day];
                  onChange({ ...scheduling, weekdays: next.sort() });
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  selected ? "bg-atlas-brand text-white" : "bg-atlas-canvas text-atlas-muted dark:bg-zinc-800"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}

      {taskType === "monthly" ? (
        <div>
          <label className="text-xs text-atlas-muted">يوم الشهر</label>
          <Input
            type="number"
            min={1}
            max={28}
            className="mt-1 w-24"
            value={scheduling.monthDay ?? 1}
            onChange={(e) => onChange({ ...scheduling, monthDay: Number(e.target.value) || 1 })}
          />
        </div>
      ) : null}

      {summary ? (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
          {summary}
        </div>
      ) : null}
    </div>
  );
}
