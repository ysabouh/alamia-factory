export function formatMoney(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

export function formatMinutes(a: unknown, b?: unknown): number {
  return Math.round(Number(a) || 0) + Math.round(Number(b) || 0);
}

/** عرض ساعات الدوام (مثال: 8.00 أو 7.50) */
/** عرض تاريخ اليوم المحدد في الحضور اليومي */
export function formatAttendanceDayLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("ar", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

export function formatWorkHours(hours: unknown, minutes?: unknown): string {
  if (minutes !== undefined) {
    const h = (Number(minutes) || 0) / 60;
    return Number.isFinite(h) ? h.toFixed(2) : "0.00";
  }
  const n = Number(hours);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}
