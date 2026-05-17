import type { PaginatedMeta } from "@/features/workforce/employee-management/workforce-api-types";
import type { ManagedEmployee } from "@/features/workforce/employee-management/model";
import {
  managedEmployeeFromApi,
  parseApiEmployeeDetail
} from "@/features/workforce/employee-management/workforce-employee-mapper";

import { getLaravelApiBaseUrl } from "@/lib/api/resolve-api-base";
import { getLaravelSsrBearerToken, laravelServerAuthHeaders } from "@/lib/api/laravel-server-auth";

const TIMEOUT_MS = Number(process.env.LARAVEL_API_FETCH_TIMEOUT_MS ?? "12000");

export type InitialEmployeeListPayload = {
  employees: ManagedEmployee[];
  meta: PaginatedMeta;
};

/** أول صفحة من سجل الموظفين من Laravel على الخادم (يتطلب ‎LARAVEL_SSR_BEARER_TOKEN‎). */
export async function fetchWorkforceEmployeesListSsr(): Promise<InitialEmployeeListPayload | null> {
  if (!getLaravelSsrBearerToken()) return null;
  const q = new URLSearchParams({
    page: "1",
    pageSize: "20",
    sortBy: "createdAt",
    sortOrder: "desc"
  });
  const url = `${getLaravelApiBaseUrl()}/workforce/employees?${q.toString()}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...laravelServerAuthHeaders()
    },
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: unknown[]; meta?: PaginatedMeta };
  const rawList = Array.isArray(json.data) ? json.data : [];
  const employees = rawList
    .map((raw) => {
      const d = parseApiEmployeeDetail(raw);
      return d ? managedEmployeeFromApi(d) : null;
    })
    .filter((x): x is ManagedEmployee => x !== null);

  const m = json.meta;
  const total = Math.max(0, Number(m?.total) || employees.length);
  const pageSize = Math.max(1, Number(m?.pageSize) || 20);
  const totalPages = Math.max(1, Number(m?.totalPages) || Math.ceil(total / pageSize) || 1);
  const meta: PaginatedMeta = {
    page: Math.max(1, Number(m?.page) || 1),
    pageSize,
    total,
    totalPages
  };

  if (employees.length === 0 && total === 0) return null;
  return { employees, meta };
}
