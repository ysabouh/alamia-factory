/** ساعات 0–24، دقائق 0–60 (كما في إعدادات المصنع) */
export const OVERTIME_HOUR_MIN = 0;
export const OVERTIME_HOUR_MAX = 24;
export const OVERTIME_MINUTE_MIN = 0;
export const OVERTIME_MINUTE_MAX = 60;

export const OVERTIME_HOUR_OPTIONS = Array.from(
  { length: OVERTIME_HOUR_MAX - OVERTIME_HOUR_MIN + 1 },
  (_, i) => OVERTIME_HOUR_MIN + i
);

export const OVERTIME_MINUTE_OPTIONS = Array.from(
  { length: OVERTIME_MINUTE_MAX - OVERTIME_MINUTE_MIN + 1 },
  (_, i) => OVERTIME_MINUTE_MIN + i
);

export function parseOvertimeTime(value: string): { hour: number; minute: number } {
  const parts = value.trim().split(":");
  const hour = Number(parts[0]);
  const minute = Number(parts[1] ?? 0);
  return {
    hour: Number.isFinite(hour)
      ? Math.min(OVERTIME_HOUR_MAX, Math.max(OVERTIME_HOUR_MIN, hour))
      : OVERTIME_HOUR_MIN,
    minute: Number.isFinite(minute)
      ? Math.min(OVERTIME_MINUTE_MAX, Math.max(OVERTIME_MINUTE_MIN, minute))
      : OVERTIME_MINUTE_MIN
  };
}

/** يُطبّق قيود 24:00 و60 دقيقة → الساعة التالية */
export function formatOvertimeTime(hour: number, minute: number): string {
  let h = Math.min(OVERTIME_HOUR_MAX, Math.max(OVERTIME_HOUR_MIN, hour));
  let m = Math.min(OVERTIME_MINUTE_MAX, Math.max(OVERTIME_MINUTE_MIN, minute));

  if (m === OVERTIME_MINUTE_MAX) {
    h = Math.min(OVERTIME_HOUR_MAX, h + 1);
    m = OVERTIME_MINUTE_MIN;
  }
  if (h === OVERTIME_HOUR_MAX) {
    m = OVERTIME_MINUTE_MIN;
  }

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function clampOvertimeTimeString(value: string): string {
  const { hour, minute } = parseOvertimeTime(value);
  return formatOvertimeTime(hour, minute);
}
