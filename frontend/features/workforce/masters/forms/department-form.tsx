"use client";

import { WfmInput, WfmSelect, WfmTextarea } from "@/components/workforce/atlas";
import type { DepartmentMaster, HallMaster } from "@/lib/api/workforce-masters-client";

import { EmployeeManagerPicker } from "@/features/workforce/employee-management/components/employee-manager-picker";

export type DepartmentFormValues = {
  name: string;
  code: string;
  hallId: string;
  parentId: string;
  description: string;
  vacancyCount: number;
  managerId: string;
};

export function emptyDepartmentForm(): DepartmentFormValues {
  return { name: "", code: "", hallId: "", parentId: "", description: "", vacancyCount: 0, managerId: "" };
}

export function departmentFormFromRow(row: DepartmentMaster): DepartmentFormValues {
  return {
    name: row.name,
    code: row.code,
    hallId: row.hallId ?? "",
    parentId: row.parentId ?? "",
    description: row.description ?? "",
    vacancyCount: row.vacancyCount ?? 0,
    managerId: row.managerId ?? ""
  };
}

export function validateDepartmentForm(values: DepartmentFormValues): string | null {
  if (!values.hallId.trim()) return "يجب اختيار القاعة";
  if (!values.name.trim()) return "يجب إدخال اسم القسم";
  if (!values.code.trim()) return "يجب إدخال رمز القسم";
  if (!values.managerId.trim()) return "يجب اختيار مدير القسم";
  return null;
}

export function departmentFormToPayload(values: DepartmentFormValues): Record<string, unknown> {
  const validationError = validateDepartmentForm(values);
  if (validationError) {
    throw new Error(validationError);
  }
  return {
    hallId: values.hallId,
    parentId: values.parentId.trim() || null,
    name: values.name.trim(),
    code: values.code.trim(),
    description: values.description.trim() || null,
    vacancyCount: values.vacancyCount,
    managerId: values.managerId.trim()
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
        القاعة <span className="text-red-600">*</span>
        <WfmSelect
          className="mt-1 w-full"
          value={values.hallId}
          disabled={disabled}
          required
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
        الاسم <span className="text-red-600">*</span>
        <WfmInput
          className="mt-1 w-full"
          value={values.name}
          disabled={disabled}
          required
          onChange={(e) => onChange({ ...values, name: e.target.value })}
        />
      </label>
      <label className="block text-xs text-atlas-muted">
        الرمز <span className="text-red-600">*</span>
        <WfmInput
          className="mt-1 w-full font-mono"
          value={values.code}
          disabled={disabled}
          required
          onChange={(e) => onChange({ ...values, code: e.target.value.toUpperCase() })}
        />
      </label>
      <label className="block text-xs text-atlas-muted sm:col-span-2">
        مدير القسم <span className="text-red-600">*</span>
        <div className="mt-1">
          <EmployeeManagerPicker
            value={values.managerId}
            disabled={disabled}
            onChange={(managerId) => onChange({ ...values, managerId })}
          />
        </div>
        <p className="mt-1 text-[10px] text-atlas-muted">
          يُعيَّن كمدير إداري للقسم ويُضاف تلقائياً إلى موظفي القسم عند الحفظ.
        </p>
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
      <label className="block text-xs text-atlas-muted sm:col-span-2">
        عدد الشواغر (يدوي)
        <WfmInput
          type="number"
          min={0}
          className="mt-1 w-full font-mono"
          value={values.vacancyCount}
          disabled={disabled}
          onChange={(e) => onChange({ ...values, vacancyCount: Number(e.target.value) || 0 })}
        />
      </label>
    </div>
  );
}
