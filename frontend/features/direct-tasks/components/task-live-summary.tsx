"use client";

import {
  DIRECT_TASK_CATEGORY_LABELS,
  DIRECT_TASK_PRIORITY_LABELS,
  DIRECT_TASK_TYPE_LABELS,
  formatScheduleSummary
} from "@/features/direct-tasks/create/create-direct-task-labels";
import type { CreateDirectTaskFormValues } from "@/features/direct-tasks/create/create-direct-task-schema";

type Props = {
  values: CreateDirectTaskFormValues;
  attachmentCount: number;
};

export function TaskLiveSummary({ values, attachmentCount }: Props) {
  const scheduleSummary = formatScheduleSummary(values);

  return (
    <div className="rounded-xl border border-atlas-rule bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-bold text-atlas-ink dark:text-zinc-100">ملخص مباشر</h3>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-atlas-muted">العنوان</dt>
          <dd className="font-medium text-end">{values.title || "—"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-atlas-muted">التصنيف</dt>
          <dd>{DIRECT_TASK_CATEGORY_LABELS[values.category] ?? values.category}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-atlas-muted">الأولوية</dt>
          <dd>{DIRECT_TASK_PRIORITY_LABELS[values.priority] ?? values.priority}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-atlas-muted">النوع</dt>
          <dd>{DIRECT_TASK_TYPE_LABELS[values.taskType] ?? values.taskType}</dd>
        </div>
        {scheduleSummary ? (
          <div>
            <dt className="text-atlas-muted">الجدولة</dt>
            <dd className="mt-1 text-xs leading-relaxed text-atlas-slate">{scheduleSummary}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-2">
          <dt className="text-atlas-muted">المسؤولون</dt>
          <dd>{values.assignments.length}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-atlas-muted">بنود القائمة</dt>
          <dd>{values.checklist.length}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-atlas-muted">المرفقات</dt>
          <dd>{attachmentCount}</dd>
        </div>
        {values.scheduling.expectedDurationMinutes ? (
          <div className="flex justify-between gap-2">
            <dt className="text-atlas-muted">المدة المتوقعة</dt>
            <dd>{values.scheduling.expectedDurationMinutes} د</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
