"use client";

import { Switch } from "@/components/ui/switch";
import type { CreateDirectTaskFormValues } from "@/features/direct-tasks/create/create-direct-task-schema";

type Props = {
  options: CreateDirectTaskFormValues["options"];
  onChange: (options: CreateDirectTaskFormValues["options"]) => void;
};

const TOGGLES: { key: keyof NonNullable<CreateDirectTaskFormValues["options"]>; label: string }[] = [
  { key: "requireManagerApproval", label: "يتطلب موافقة المدير" },
  { key: "requireSupervisorApproval", label: "يتطلب موافقة المشرف" },
  { key: "requireCommentBeforeClose", label: "يتطلب تعليقاً قبل الإغلاق" },
  { key: "requireImage", label: "يتطلب صورة" },
  { key: "requireSignature", label: "يتطلب توقيعاً" },
  { key: "autoReopenIfRejected", label: "إعادة فتح تلقائية عند الرفض" },
  { key: "autoReminder", label: "تذكير تلقائي" },
  { key: "escalateOverdue", label: "تصعيد المهام المتأخرة" }
];

export function TaskExtraOptions({ options, onChange }: Props) {
  return (
    <div className="rounded-xl border border-atlas-rule bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-bold text-atlas-ink dark:text-zinc-100">خيارات إضافية</h3>
      <div className="space-y-3">
        {TOGGLES.map((t) => (
          <label key={t.key} className="flex items-center justify-between gap-3 text-sm">
            <span>{t.label}</span>
            <Switch
              checked={Boolean(options[t.key])}
              onCheckedChange={(v) => onChange({ ...options, [t.key]: v })}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
