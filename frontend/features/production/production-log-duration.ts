export function productionLogDurationMinutes(from: string | null | undefined, to: string | null | undefined): number | null {
  if (!from || !to) return null;
  const start = new Date(from);
  const end = new Date(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;
  return Math.round((end.getTime() - start.getTime()) / 60_000);
}

export function formatProductionLogDuration(from: string | null | undefined, to: string | null | undefined): string {
  const minutes = productionLogDurationMinutes(from, to);
  if (minutes == null) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours.toLocaleString("ar")} س ${mins.toLocaleString("ar")} د`;
  }
  if (hours > 0) return `${hours.toLocaleString("ar")} س`;
  return `${mins.toLocaleString("ar")} د`;
}

export function toDatetimeLocalValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function todayStartDatetimeLocal() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return toDatetimeLocalValue(d);
}

export function nowDatetimeLocal() {
  return toDatetimeLocalValue(new Date());
}

export function formatLogDatetime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ar");
}
