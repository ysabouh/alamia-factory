"use client";

import { WfmInput, WfmSelect, WfmTextarea } from "@/components/workforce/atlas";
import type { DepartmentMaster, HallMaster } from "@/lib/api/workforce-masters-client";

export type DepartmentFormValues = {
  name: string;
  code: string;
  hallId: string;
  description: string;
};

export function emptyDepartmentForm(): DepartmentFormValues {
  return { name: "", code: "", hallId: "", description: "" };
}

export function departmentFormFromRow(row: DepartmentMaster): DepartmentFormValues {
  return {
    name: row.name,
    code: row.code,
    hallId: row.hallId ?? "",
    description: row.description ?? ""
  };
}

export function departmentFormToPayload(values: DepartmentFormValues): Record<string, unknown> {
  return {
    hallId: values.hallId,
    name: values.name.trim(),
    code: values.code.trim(),
    description: values.description.trim() || null
  };
}

export function DepartmentForm({
  values,
  onChange,
  halls,
  disabled
}: {
  values: DepartmentFormValues;
  onChange: (v: DepartmentFormValues) => void;
  halls: HallMaster[];
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-xs text-atlas-muted sm:col-span-2">
        القاعة
        <WfmSelect
          className="mt-1 w-full"
          value={values.hallId}
          disabled={disabled}
          onChange={(e) => onChange({ ...values, hallId: e.target.value })}
        >
          <option value="">— اختر قاعة —</option>
          {halls.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name} ({h.code})
            </option>
          ))}
        </WfmSelect>
      </label>
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
