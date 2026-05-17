"use client";

import { WfmInput, WfmTextarea } from "@/components/workforce/atlas";
import type { ShiftMaster } from "@/lib/api/workforce-masters-client";

export type ShiftFormValues = {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  description: string;
};

function toTimeInput(value: string): string {
  if (!value) return "";
  const parts = value.split(":");
  if (parts.length >= 2) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  return value;
}

export function emptyShiftForm(): ShiftFormValues {
  return { name: "", code: "", startTime: "08:00", endTime: "16:00", description: "" };
}

export function shiftFormFromRow(row: ShiftMaster): ShiftFormValues {
  return {
    name: row.name,
    code: row.code,
    startTime: toTimeInput(row.startTime),
    endTime: toTimeInput(row.endTime),
    description: row.description ?? ""
  };
}

export function shiftFormToPayload(values: ShiftFormValues): Record<string, unknown> {
  return {
    name: values.name.trim(),
    code: values.code.trim(),
    startTime: toTimeInput(values.startTime),
    endTime: toTimeInput(values.endTime),
    description: values.description.trim() || null
  };
}

export function ShiftForm({
  values,
  onChange,
  disabled
}: {
  values: ShiftFormValues;
  onChange: (v: ShiftFormValues) => void;
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
        بداية الوردية
        <WfmInput
          type="time"
          className="mt-1 w-full font-mono"
          value={values.startTime}
          disabled={disabled}
          onChange={(e) => onChange({ ...values, startTime: e.target.value })}
        />
      </label>
      <label className="block text-xs text-atlas-muted">
        نهاية الوردية
        <WfmInput
          type="time"
          className="mt-1 w-full font-mono"
          value={values.endTime}
          disabled={disabled}
          onChange={(e) => onChange({ ...values, endTime: e.target.value })}
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
