export const DIRECT_TASK_CATEGORY_LABELS: Record<string, string> = {
  electrical_maintenance: "صيانة كهربائية",
  mechanical_maintenance: "صيانة ميكانيكية",
  production: "إنتاج",
  quality: "جودة",
  safety: "سلامة",
  warehouse: "مستودعات",
  hr: "موارد بشرية",
  administration: "إدارة",
  custom: "مخصص"
};

export const DIRECT_TASK_PRIORITY_LABELS: Record<string, string> = {
  low: "منخفض",
  normal: "متوسط",
  high: "مرتفع",
  urgent: "حرج"
};

export const DIRECT_TASK_TYPE_LABELS: Record<string, string> = {
  direct: "مباشرة",
  immediate: "فورية",
  emergency: "طارئة",
  daily: "يومية",
  weekly: "أسبوعية",
  monthly: "شهرية"
};

export const CHECKLIST_ITEM_TYPE_LABELS: Record<string, string> = {
  checkbox: "تحقق",
  text: "نص",
  number: "رقم",
  image: "صورة",
  file: "ملف",
  comment: "تعليق",
  date: "تاريخ",
  signature: "توقيع"
};

export const WEEKDAY_LABELS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function formatScheduleSummary(values: {
  taskType: string;
  scheduling: {
    startDate?: string;
    executionTime?: string;
    repeatEvery?: number;
    weekdays?: number[];
    monthDay?: number;
  };
}): string | null {
  const { taskType, scheduling } = values;
  const time = scheduling.executionTime ?? "08:00";
  const start = scheduling.startDate ?? "";

  if (taskType === "immediate" || taskType === "emergency" || taskType === "direct") {
    return start ? `ستُنشأ المهمة فوراً بتاريخ ${start}` : "ستُنشأ المهمة فوراً بعد الحفظ";
  }
  if (taskType === "daily") {
    const every = scheduling.repeatEvery ?? 1;
    return `سيتم إنشاء المهمة كل ${every === 1 ? "يوم" : `${every} أيام`} الساعة ${time}${start ? ` بدءاً من ${start}` : ""}`;
  }
  if (taskType === "weekly") {
    const days = (scheduling.weekdays ?? [])
      .map((d) => WEEKDAY_LABELS[d])
      .filter(Boolean)
      .join("، ");
    return `سيتم إنشاء المهمة أسبوعياً (${days || "—"}) الساعة ${time}`;
  }
  if (taskType === "monthly") {
    return `سيتم إنشاء المهمة شهرياً يوم ${scheduling.monthDay ?? 1} الساعة ${time}`;
  }
  return null;
}
