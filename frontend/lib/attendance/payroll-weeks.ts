import dayjs from "dayjs";

/** السبت = بداية الأسبوع، الجمعة = نهايته */
export function startOfPayrollWeek(date: dayjs.Dayjs): dayjs.Dayjs {
  const daysSinceSaturday = (date.day() + 1) % 7;
  return date.subtract(daysSinceSaturday, "day").startOf("day");
}

export function endOfPayrollWeek(date: dayjs.Dayjs): dayjs.Dayjs {
  return startOfPayrollWeek(date).add(6, "day");
}

export function payrollWeekBounds(date: dayjs.Dayjs): { periodStart: string; periodEnd: string } {
  const start = startOfPayrollWeek(date);
  const end = endOfPayrollWeek(date);
  return {
    periodStart: start.format("YYYY-MM-DD"),
    periodEnd: end.format("YYYY-MM-DD")
  };
}

/** الأسبوع السابق (سبت–جمعة كاملة قبل الأسبوع الحالي) */
export function previousPayrollWeekBounds(): { periodStart: string; periodEnd: string } {
  const thisSaturday = startOfPayrollWeek(dayjs());
  const prevSaturday = thisSaturday.subtract(7, "day");
  return payrollWeekBounds(prevSaturday);
}

export function formatPayrollWeekRange(periodStart: string, periodEnd: string): string {
  const fmt = (iso: string) => dayjs(iso).format("DD/MM/YYYY");
  return `${fmt(periodStart)} — ${fmt(periodEnd)}`;
}
