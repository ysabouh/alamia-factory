"use client";

import { Textarea } from "@/components/ui/textarea";
import { TaskExtraOptions } from "@/features/direct-tasks/components/task-extra-options";
import { TaskLiveSummary } from "@/features/direct-tasks/components/task-live-summary";
import { TaskWorkflowPreview } from "@/features/direct-tasks/components/task-workflow-preview";
import type { CreateDirectTaskFormValues } from "@/features/direct-tasks/create/create-direct-task-schema";

type Props = {
  values: CreateDirectTaskFormValues;
  attachmentCount: number;
  onPatch: (patch: Partial<CreateDirectTaskFormValues>) => void;
};

export function CreateDirectTaskSidebar({ values, attachmentCount, onPatch }: Props) {
  return (
    <div className="space-y-5">
      <TaskExtraOptions options={values.options} onChange={(options) => onPatch({ options })} />
      <div className="rounded-xl border border-atlas-rule bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="mb-2 text-sm font-bold">ملاحظات</h3>
        <Textarea
          value={values.notes ?? ""}
          onChange={(e) => onPatch({ notes: e.target.value })}
          maxLength={2000}
          className="min-h-[80px]"
          placeholder="ملاحظات أو تعليمات إضافية للمسؤولين..."
        />
        <p className="mt-1 text-end text-xs text-atlas-muted">{(values.notes ?? "").length}/2000</p>
      </div>
      <TaskLiveSummary values={values} attachmentCount={attachmentCount} />
      <TaskWorkflowPreview options={values.options} />
    </div>
  );
}
