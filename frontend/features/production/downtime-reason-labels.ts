const ARABIC_LABELS: Record<string, string> = {
  machine_breakdown: "عطل ماكينة",
  mold_issue: "مشكلة قالب",
  material_shortage: "نقص مواد",
  power_failure: "انقطاع كهرباء",
  quality_issue: "مشكلة جودة",
  maintenance: "صيانة",
  other: "أخرى"
};

export function downtimeReasonLabel(code: string | null | undefined, fallbackName?: string | null) {
  if (code && ARABIC_LABELS[code]) return ARABIC_LABELS[code];
  return fallbackName ?? "—";
}
