import type { BlowSpecJson, InjectionSpecJson } from "@/lib/api/machines-client";

export const injectionSpecLabels: Record<keyof InjectionSpecJson, string> = {
  clampingForceTon: "قوة الكبس (طن)",
  shotWeightGram: "وزن الحقنة (غ)",
  screwDiameterMm: "قطر اللولب (مم)",
  injectionPressureBar: "ضغط الحقن (بار)",
  heatingZonesCount: "مناطق التسخين",
  maxCycleTimeSec: "أقصى زمن دورة (ث)"
};

export const blowSpecLabels: Record<keyof BlowSpecJson, string> = {
  bottleVolumeMinMl: "حجم العبوة الأدنى (مل)",
  bottleVolumeMaxMl: "حجم العبوة الأقصى (مل)",
  cavitiesCount: "عدد التجاويف",
  airPressureBar: "ضغط الهواء (بار)",
  productionCapacityBph: "الطاقة (عبوة/ساعة)"
};

export function formatSpecEntries(
  type: string | null,
  spec: InjectionSpecJson | BlowSpecJson | null
): { label: string; value: string }[] {
  if (!spec) return [];

  const labels =
    type === "injection"
      ? injectionSpecLabels
      : type === "blow" || type === "blow_molding"
        ? blowSpecLabels
        : null;

  if (!labels) return [];

  return (Object.keys(labels) as Array<keyof typeof labels>).map((key) => {
    const raw = spec[key as keyof typeof spec];
    return {
      label: labels[key],
      value: raw != null && raw !== "" ? String(raw) : "—"
    };
  });
}
