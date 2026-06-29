"use client";

import { ArrowDown } from "lucide-react";

import type { CreateDirectTaskFormValues } from "@/features/direct-tasks/create/create-direct-task-schema";

type Props = {
  options: CreateDirectTaskFormValues["options"];
};

const BASE_STEPS = ["إنشاء المهمة", "إسناد", "قبول", "قيد التنفيذ"];
const REVIEW_STEPS = ["مراجعة", "موافقة", "إغلاق"];

function Step({ label, active }: { label: string; active?: boolean }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-center text-xs font-semibold ${
        active
          ? "border-atlas-brand bg-atlas-brand/10 text-atlas-brand"
          : "border-atlas-rule bg-white text-atlas-muted dark:border-zinc-700 dark:bg-zinc-900"
      }`}
    >
      {label}
    </div>
  );
}

export function TaskWorkflowPreview({ options }: Props) {
  const needsReview = options.requireManagerApproval || options.requireSupervisorApproval;
  const steps = needsReview ? [...BASE_STEPS, ...REVIEW_STEPS] : [...BASE_STEPS, "إغلاق"];

  return (
    <div className="rounded-xl border border-atlas-rule bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-bold text-atlas-ink dark:text-zinc-100">معاينة سير العمل</h3>
      <div className="flex flex-col items-center gap-1">
        {steps.map((step, i) => (
          <div key={step} className="flex w-full flex-col items-center">
            <Step label={step} active={i === 0} />
            {i < steps.length - 1 ? <ArrowDown className="my-0.5 h-4 w-4 text-atlas-muted" /> : null}
          </div>
        ))}
      </div>
      {needsReview ? (
        <p className="mt-3 text-[11px] text-atlas-muted">عند الرفض تعود المهمة إلى «قيد التنفيذ»</p>
      ) : null}
    </div>
  );
}
