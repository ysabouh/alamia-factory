/** قيم hall_type المعتمدة في المصنع (متسقة مع DatabaseSeeder). */
export const HALL_TYPE_OPTIONS = [
  { value: "Injection", label: "حقن (Injection)" },
  { value: "Blow Molding", label: "نفخ (Blow Molding)" },
  { value: "Packaging", label: "تغليف وتعبئة (Packaging)" },
  { value: "Maintenance", label: "صيانة (Maintenance)" }
] as const;

export type HallTypeValue = (typeof HALL_TYPE_OPTIONS)[number]["value"];

export function isKnownHallType(value: string): value is HallTypeValue {
  return HALL_TYPE_OPTIONS.some((o) => o.value === value);
}

/** خيارات القائمة + قيمة حالية غير معروفة (سجلات قديمة أو مخصصة). */
export function hallTypeLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return HALL_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function hallTypeSelectOptions(currentValue?: string | null) {
  const known = [...HALL_TYPE_OPTIONS];
  const v = currentValue?.trim();
  if (v && !isKnownHallType(v)) {
    return [{ value: v, label: `${v} (قيمة حالية)` }, ...known];
  }
  return known;
}
