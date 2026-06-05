"use client";

import type { UseFormRegister } from "react-hook-form";

import { WfmField, WfmInput } from "@/components/workforce/atlas";
import type { MachineFormValues } from "@/features/machines/management/machine-form-schema";

type SpecField = keyof NonNullable<MachineFormValues["blowSpec"]>;

const fields: { key: SpecField; label: string }[] = [
  { key: "bottleVolumeMinMl", label: "حجم العبوة الأدنى (مل)" },
  { key: "bottleVolumeMaxMl", label: "حجم العبوة الأقصى (مل)" },
  { key: "cavitiesCount", label: "عدد التجاويف" },
  { key: "airPressureBar", label: "ضغط الهواء (بار)" },
  { key: "productionCapacityBph", label: "الطاقة (عبوة/ساعة)" }
];

export function BlowSpecFields({
  register,
  disabled
}: {
  register: UseFormRegister<MachineFormValues>;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {fields.map((f) => (
        <WfmField key={f.key} label={f.label}>
          <WfmInput type="number" step="any" disabled={disabled} {...register(`blowSpec.${f.key}`)} />
        </WfmField>
      ))}
    </div>
  );
}
