"use client";

import type { UseFormRegister } from "react-hook-form";

import { WfmField, WfmInput } from "@/components/workforce/atlas";
import type { MachineFormValues } from "@/features/machines/management/machine-form-schema";

type SpecField = keyof NonNullable<MachineFormValues["injectionSpec"]>;

const fields: { key: SpecField; label: string }[] = [
  { key: "clampingForceTon", label: "قوة الكبس (طن)" },
  { key: "shotWeightGram", label: "وزن الحقنة (غ)" },
  { key: "screwDiameterMm", label: "قطر اللولب (مم)" },
  { key: "injectionPressureBar", label: "ضغط الحقن (بار)" },
  { key: "heatingZonesCount", label: "مناطق التسخين" },
  { key: "maxCycleTimeSec", label: "أقصى زمن دورة (ث)" }
];

export function InjectionSpecFields({
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
          <WfmInput type="number" step="any" disabled={disabled} {...register(`injectionSpec.${f.key}`)} />
        </WfmField>
      ))}
    </div>
  );
}
