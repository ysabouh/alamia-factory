"use client";

import { WfmInput, WfmTextarea } from "@/components/workforce/atlas";
import type { JobRoleMaster } from "@/lib/api/workforce-masters-client";

export type JobRoleFormValues = {
  name: string;
  code: string;
  roleLevel: string;
  description: string;
};

export function emptyJobRoleForm(): JobRoleFormValues {
  return { name: "", code: "", roleLevel: "1", description: "" };
}

export function jobRoleFormFromRow(row: JobRoleMaster): JobRoleFormValues {
  return {
    name: row.name,
    code: row.code,
    roleLevel: String(row.roleLevel),
    description: row.description ?? ""
  };
}

export function jobRoleFormToPayload(values: JobRoleFormValues): Record<string, unknown> {
  return {
    name: values.name.trim(),
    code: values.code.trim(),
    roleLevel: Number(values.roleLevel),
    description: values.description.trim() || null
  };
}

export function JobRoleForm({
  values,
  onChange,
  disabled
}: {
  values: JobRoleFormValues;
  onChange: (v: JobRoleFormValues) => void;
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
        مستوى الدور (1–10)
        <WfmInput
          type="number"
          min={1}
          max={10}
          className="mt-1 w-full font-mono"
          value={values.roleLevel}
          disabled={disabled}
          onChange={(e) => onChange({ ...values, roleLevel: e.target.value })}
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
