"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmployeeSelector } from "@/features/direct-tasks/components/employee-selector";
import { ChecklistBuilder } from "@/features/direct-tasks/components/checklist-builder";
import { TaskAttachmentsDropzone } from "@/features/direct-tasks/components/task-attachments-dropzone";
import { TaskSchedulingPanel } from "@/features/direct-tasks/components/task-scheduling-panel";
import { TaskTypeSelector } from "@/features/direct-tasks/components/task-type-selector";
import {
  DIRECT_TASK_CATEGORY_LABELS,
  DIRECT_TASK_PRIORITY_LABELS
} from "@/features/direct-tasks/create/create-direct-task-labels";
import type { CreateDirectTaskFormValues } from "@/features/direct-tasks/create/create-direct-task-schema";
import { directTaskCategories, directTaskPriorities } from "@/features/direct-tasks/create/create-direct-task-schema";

type Props = {
  values: CreateDirectTaskFormValues;
  errors: Record<string, string>;
  pendingFiles: File[];
  onPatch: (patch: Partial<CreateDirectTaskFormValues>) => void;
  onFilesChange: (files: File[]) => void;
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-atlas-rule bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="mb-4 text-sm font-bold text-atlas-ink dark:text-zinc-100">{title}</h2>
      {children}
    </section>
  );
}

export function CreateDirectTaskForm({ values, errors, pendingFiles, onPatch, onFilesChange }: Props) {
  return (
    <div className="space-y-5">
      <SectionCard title="معلومات المهمة">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <label className="text-xs text-atlas-muted">عنوان المهمة *</label>
            <Input
              className="mt-1"
              value={values.title}
              onChange={(e) => onPatch({ title: e.target.value })}
              placeholder="مثال: فحص المولدات الكهربائية"
            />
            {errors.title ? <p className="mt-1 text-xs text-red-600">{errors.title}</p> : null}
          </div>
          <div>
            <label className="text-xs text-atlas-muted">التصنيف</label>
            <select
              className="atlas-input mt-1 w-full"
              value={values.category}
              onChange={(e) => onPatch({ category: e.target.value as CreateDirectTaskFormValues["category"] })}
            >
              {directTaskCategories.map((c) => (
                <option key={c} value={c}>
                  {DIRECT_TASK_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-atlas-muted">الأولوية</label>
            <select
              className="atlas-input mt-1 w-full"
              value={values.priority}
              onChange={(e) => onPatch({ priority: e.target.value as CreateDirectTaskFormValues["priority"] })}
            >
              {directTaskPriorities.map((p) => (
                <option key={p} value={p}>
                  {DIRECT_TASK_PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="text-xs text-atlas-muted">وصف المهمة *</label>
            <Textarea
              className="mt-1 min-h-[120px]"
              value={values.description}
              onChange={(e) => onPatch({ description: e.target.value })}
              maxLength={5000}
            />
            <p className="mt-1 text-end text-xs text-atlas-muted">{values.description.length}/5000</p>
            {errors.description ? <p className="text-xs text-red-600">{errors.description}</p> : null}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="نوع المهمة وتكرارها">
        <TaskTypeSelector value={values.taskType} onChange={(taskType) => onPatch({ taskType })} />
        <div className="mt-4">
          <TaskSchedulingPanel
            taskType={values.taskType}
            scheduling={values.scheduling}
            onChange={(scheduling) => onPatch({ scheduling })}
          />
        </div>
      </SectionCard>

      <SectionCard title="إسناد المسؤولين">
        <EmployeeSelector
          mode={values.assignmentMode}
          onModeChange={(assignmentMode) => onPatch({ assignmentMode })}
          assignments={values.assignments}
          onChange={(assignments) => onPatch({ assignments })}
        />
      </SectionCard>

      <SectionCard title="مرفقات إضافية">
        <TaskAttachmentsDropzone files={pendingFiles} onChange={onFilesChange} />
      </SectionCard>

      <SectionCard title="قائمة التحقق">
        <p className="mb-4 text-xs text-atlas-muted">
          حدّد بنود التنفيذ المطلوبة من المسؤول — يمكنك اختيار قالب جاهز أو بناء قائمة مخصصة.
        </p>
        <ChecklistBuilder
          embedded
          items={values.checklist}
          options={values.options}
          onItemsChange={(checklist) => onPatch({ checklist })}
          onOptionsChange={(options) => onPatch({ options })}
        />
      </SectionCard>
    </div>
  );
}
