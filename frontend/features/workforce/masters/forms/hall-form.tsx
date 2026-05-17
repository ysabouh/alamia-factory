"use client";

import { WfmInput, WfmSelect, WfmTextarea } from "@/components/workforce/atlas";
import { hallTypeSelectOptions } from "@/features/workforce/masters/hall-types";
import type { HallMaster } from "@/lib/api/workforce-masters-client";

export type HallFormValues = {
  name: string;
  code: string;
  hallType: string;
  description: string;
};

export function emptyHallForm(): HallFormValues {
  return { name: "", code: "", hallType: "", description: "" };
}

export function hallFormFromRow(row: HallMaster): HallFormValues {
  return {
    name: row.name,
    code: row.code,
    hallType: row.hallType ?? "",
    description: row.description ?? ""
  };
}

export function hallFormToPayload(values: HallFormValues): Record<string, unknown> {
  return {
    name: values.name.trim(),
    code: values.code.trim(),
    hallType: values.hallType.trim() || null,
    description: values.description.trim() || null
  };
}

export function HallForm({
  values,
  onChange,
  disabled
}: {
  values: HallFormValues;
  onChange: (v: HallFormValues) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-xs text-atlas-muted sm:col-span-2">
        الاسم
        <WfmInput
          className="mt-1 w-full"
          value={values.name}
          disabled={disabled}
          onChange={(e) => onChange({ ...values, name: e.target.value })}
        />
      </label>
      <label className="block text-xs text-atlas-muted">
        الرمز
        <WfmInput
          className="mt-1 w-full font-mono"
          value={values.code}
          disabled={disabled}
          onChange={(e) => onChange({ ...values, code: e.target.value.toUpperCase() })}
        />
      </label>
      <label className="block text-xs text-atlas-muted">
        نوع القاعة
        <WfmSelect
          className="mt-1 w-full"
          value={values.hallType}
          disabled={disabled}
          onChange={(e) => onChange({ ...values, hallType: e.target.value })}
        >
          <option value="">— اختر نوع القاعة —</option>
          {hallTypeSelectOptions(values.hallType).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </WfmSelect>
      </label>
      <label className="block text-xs text-atlas-muted sm:col-span-2">
        الوصف
        <WfmTextarea
          className="mt-1 w-full min-h-[72px]"
          value={values.description}
          disabled={disabled}
          onChange={(e) => onChange({ ...values, description: e.target.value })}
        />
      </label>
    </div>
  );
}
