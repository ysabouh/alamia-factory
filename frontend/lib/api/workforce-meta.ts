/** تحويل استجابة Laravel ‎`GET /workforce/meta`‎ إلى شكل خام يقبله ‎`normalizeWorkforceCatalog`‎. */

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

export function rawCatalogFromWorkforceMetaResponse(res: unknown): {
  halls: Record<string, unknown>[];
  departments: Record<string, unknown>[];
  shifts: Record<string, unknown>[];
  jobRoles: Record<string, unknown>[];
  statuses: Record<string, unknown>[];
  currencies: Record<string, unknown>[];
  baseCurrencyCode: string;
} {
  const root = asRecord(res);
  const data = asRecord(root?.data) ?? root;
  const d = data ?? {};
  const halls = Array.isArray(d.halls) ? (d.halls as Record<string, unknown>[]) : [];
  const departments = Array.isArray(d.departments) ? (d.departments as Record<string, unknown>[]) : [];
  const jobRoles = Array.isArray(d.jobRoles) ? (d.jobRoles as Record<string, unknown>[]) : [];
  const rawShifts = Array.isArray(d.shifts) ? (d.shifts as Record<string, unknown>[]) : [];
  const shifts = rawShifts.map((r) => ({
    ...r,
    startTime: String(r.startTime ?? r.startsAt ?? ""),
    endTime: String(r.endTime ?? r.endsAt ?? "")
  }));
  const employmentStatuses = Array.isArray(d.employmentStatuses)
    ? (d.employmentStatuses as Record<string, unknown>[])
    : [];
  const currencies = Array.isArray(d.currencies) ? (d.currencies as Record<string, unknown>[]) : [];
  return {
    halls,
    departments,
    shifts,
    jobRoles,
    statuses: employmentStatuses,
    currencies,
    baseCurrencyCode: String(d.baseCurrencyCode ?? "USD")
  };
}
