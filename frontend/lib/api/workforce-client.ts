import type { PaginatedMeta } from "@/features/workforce/employee-management/workforce-api-types";

import { getLaravelApiBaseUrl } from "@/lib/api/resolve-api-base";
import { rawCatalogFromWorkforceMetaResponse } from "@/lib/api/workforce-meta";
import { authFetchHeaders } from "@/lib/auth/factory-auth-api";

const WORKFORCE_FETCH_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_WORKFORCE_FETCH_TIMEOUT_MS ?? "15000");

function withTimeout(signal: AbortSignal | undefined, ms: number): AbortSignal {
  const t = AbortSignal.timeout(ms);
  return signal ? AbortSignal.any([t, signal]) : t;
}

export class WorkforceApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "WorkforceApiError";
  }
}

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    u.set(k, String(v));
  }
  const q = u.toString();
  return q ? `?${q}` : "";
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getLaravelApiBaseUrl()}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      ...authFetchHeaders(),
      ...init?.headers
    },
    cache: "no-store",
    signal: withTimeout(init?.signal ?? undefined, WORKFORCE_FETCH_TIMEOUT_MS)
  });

  const text = await response.text();
  if (!response.ok) {
    let msg = `${response.status} ${response.statusText}`;
    try {
      const j = JSON.parse(text) as {
        message?: string | string[];
        errors?: Record<string, string[]>;
      };
      if (typeof j.message === "string") msg = j.message;
      else if (Array.isArray(j.message)) msg = j.message.join(", ");
      else if (j.errors) {
        const first = Object.values(j.errors)[0];
        if (Array.isArray(first) && first[0]) msg = String(first[0]);
      }
    } catch {
      if (text) msg = text.slice(0, 200);
    }
    throw new WorkforceApiError(response.status, msg);
  }

  return (text ? JSON.parse(text) : {}) as T;
}

export type PaginatedResponse<T> = { data: T[]; meta: PaginatedMeta };

/** Fetch all rows from a paged workforce list endpoint (pageSize=100). */
export async function fetchAllPaged<T>(path: string): Promise<T[]> {
  let page = 1;
  const out: T[] = [];
  for (;;) {
    const res = await requestJson<PaginatedResponse<T>>(`${path}${buildQuery({ page, pageSize: 100 })}`);
    out.push(...res.data);
    if (page >= res.meta.totalPages) break;
    page += 1;
  }
  return out;
}

export const workforceApi = {
  listEmployees: (params: Record<string, string | number | boolean | undefined | null>) =>
    requestJson<PaginatedResponse<unknown>>(`/workforce/employees${buildQuery(params)}`),

  getEmployee: (id: string) => requestJson<unknown>(`/workforce/employees/${encodeURIComponent(id)}`),

  createEmployee: (body: Record<string, unknown>) =>
    requestJson<unknown>("/workforce/employees", { method: "POST", body: JSON.stringify(body) }),

  updateEmployee: (id: string, body: Record<string, unknown>) =>
    requestJson<unknown>(`/workforce/employees/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body)
    }),

  deleteEmployee: (id: string) =>
    requestJson<{ deleted: boolean }>(`/workforce/employees/${encodeURIComponent(id)}`, { method: "DELETE" }),

  loadCatalog: async () => {
    const res = await requestJson<unknown>("/workforce/meta");
    return rawCatalogFromWorkforceMetaResponse(res);
  },

  getOrgChart: () => requestJson<{ data: import("@/features/workforce/employee-management/org-chart/org-chart-types").OrgChartData }>("/workforce/org-chart"),

  getOrgChartLayout: () =>
    requestJson<{ data: import("@/features/workforce/employee-management/org-chart/org-chart-settings-types").OrgChartLayoutPayload }>(
      "/workforce/org-chart/settings"
    ),

  updateOrgChartSettings: (body: Partial<import("@/features/workforce/employee-management/org-chart/org-chart-settings-types").OrgChartLayoutSettings>) =>
    requestJson<{ data: import("@/features/workforce/employee-management/org-chart/org-chart-settings-types").OrgChartLayoutPayload }>(
      "/workforce/org-chart/settings",
      { method: "PATCH", body: JSON.stringify(body) }
    ),

  updateOrgChartPositions: (positions: Record<string, { x: number; y: number }>) =>
    requestJson<{ data: import("@/features/workforce/employee-management/org-chart/org-chart-settings-types").OrgChartLayoutPayload }>(
      "/workforce/org-chart/positions",
      { method: "PATCH", body: JSON.stringify({ positions }) }
    ),

  resetOrgChartPositions: () =>
    requestJson<{ data: import("@/features/workforce/employee-management/org-chart/org-chart-settings-types").OrgChartLayoutPayload }>(
      "/workforce/org-chart/positions/reset",
      { method: "POST" }
    ),

  updateReporting: (employeeId: string, body: { reportsToId?: string | null; departmentId?: string | null; orgPositionId?: string | null }) =>
    requestJson<{ data: { id: string; reportsToId: string | null; departmentId: string | null; orgPositionId?: string | null } }>(
      `/workforce/employees/${encodeURIComponent(employeeId)}/reporting`,
      { method: "PATCH", body: JSON.stringify(body) }
    ),

  getFactoryOrgSettings: () =>
    requestJson<{ data: import("@/features/workforce/employee-management/org-chart/org-chart-types").FactoryOrgSettings }>(
      "/workforce/org-chart/factory-settings"
    ),

  updateFactoryOrgSettings: (body: Partial<import("@/features/workforce/employee-management/org-chart/org-chart-types").FactoryOrgSettings>) =>
    requestJson<{ data: import("@/features/workforce/employee-management/org-chart/org-chart-types").FactoryOrgSettings }>(
      "/workforce/org-chart/factory-settings",
      { method: "PATCH", body: JSON.stringify(body) }
    ),

  listCertifications: (employeeId: string) =>
    requestJson<{ data: import("@/features/workforce/employee-management/org-chart/org-chart-types").EmployeeCertificationJson[] }>(
      `/workforce/employees/${encodeURIComponent(employeeId)}/certifications`
    ),

  addCertification: (employeeId: string, body: Record<string, unknown>) =>
    requestJson<{ data: import("@/features/workforce/employee-management/org-chart/org-chart-types").EmployeeCertificationJson }>(
      `/workforce/employees/${encodeURIComponent(employeeId)}/certifications`,
      { method: "POST", body: JSON.stringify(body) }
    ),

  deleteCertification: (employeeId: string, certId: string) =>
    requestJson<{ deleted: boolean }>(
      `/workforce/employees/${encodeURIComponent(employeeId)}/certifications/${encodeURIComponent(certId)}`,
      { method: "DELETE" }
    )
};
