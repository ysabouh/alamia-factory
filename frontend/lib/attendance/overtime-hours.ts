import { formatOvertimeTime, parseOvertimeTime } from "@/lib/attendance/overtime-time";

/** معاملات الإضافي — متوافقة مع backend/config/factory.php */
export const OVERTIME_WEEKDAY_MULTIPLIER = 1.5;
export const OVERTIME_FRIDAY_MULTIPLIER = 2;

export type OvertimeHoursComputed = {
  durationHours: number;
  weightedHours: number;
  rateMultiplier: number;
  multiplierLabel: string;
  isFriday: boolean;
};

export type OvertimePolicyJson = {
  weekdayMultiplier: number;
  fridayMultiplier: number;
  weekdayLabel: string;
  fridayLabel: string;
};

/** لا يعتمد على DEFAULT_OVERTIME_POLICY — لتجنّب تهيئة دائرية */
function buildMultiplierLabel(multiplier: number, fridayMultiplier: number): string {
  const fmt = (n: number) => String(Number(n.toFixed(2))).replace(/\.?0+$/, "");
  if (Math.abs(multiplier - fridayMultiplier) < 0.001) {
    return `ضعف (×${fmt(multiplier)})`;
  }
  return `ضعف ونصف (×${fmt(multiplier)})`;
}

export const DEFAULT_OVERTIME_POLICY: OvertimePolicyJson = {
  weekdayMultiplier: OVERTIME_WEEKDAY_MULTIPLIER,
  fridayMultiplier: OVERTIME_FRIDAY_MULTIPLIER,
  weekdayLabel: buildMultiplierLabel(OVERTIME_WEEKDAY_MULTIPLIER, OVERTIME_FRIDAY_MULTIPLIER),
  fridayLabel: buildMultiplierLabel(OVERTIME_FRIDAY_MULTIPLIER, OVERTIME_FRIDAY_MULTIPLIER)
};

function timeOnDate(date: string, time: string): Date {
  const { hour, minute } = parseOvertimeTime(time);
  if (hour === 24) {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + 1);
    return d;
  }
  return new Date(`${date}T${formatOvertimeTime(hour, minute)}:00`);
}

function parseWindow(date: string, startTime: string, endTime: string): { start: Date; end: Date } {
  const start = timeOnDate(date, startTime);
  let end = timeOnDate(date, endTime);
  if (end.getTime() <= start.getTime()) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }
  return { start, end };
}

function isFridayDate(date: string): boolean {
  return new Date(`${date}T12:00:00`).getDay() === 5;
}

export function multiplierForDate(date: string, policy = DEFAULT_OVERTIME_POLICY): number {
  return isFridayDate(date) ? policy.fridayMultiplier : policy.weekdayMultiplier;
}

export function multiplierLabel(multiplier: number, policy = DEFAULT_OVERTIME_POLICY): string {
  return buildMultiplierLabel(multiplier, policy.fridayMultiplier);
}

export function computeOvertimeHours(
  overtimeDate: string,
  startTime: string,
  endTime: string,
  policy = DEFAULT_OVERTIME_POLICY
): OvertimeHoursComputed {
  const { start, end } = parseWindow(overtimeDate, startTime, endTime);
  const durationHours = Math.max(0, Math.round(((end.getTime() - start.getTime()) / 3_600_000) * 100) / 100);
  const rateMultiplier = multiplierForDate(overtimeDate, policy);
  const weightedHours = Math.round(durationHours * rateMultiplier * 100) / 100;

  return {
    durationHours,
    weightedHours,
    rateMultiplier,
    multiplierLabel: multiplierLabel(rateMultiplier, policy),
    isFriday: isFridayDate(overtimeDate)
  };
}

export function formatHours(h: number): string {
  return h.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
