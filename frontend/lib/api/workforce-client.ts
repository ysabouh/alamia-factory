import type { PaginatedMeta } from "@/features/workforce/employee-management/workforce-api-types";

export const WORKFORCE_API_BASE =
  process.env.NEXT_PUBLIC_WORKFORCE_API_URL ?? "http://127.0.0.1:4000/api/v1";

/** يمنع تعليق الواجهة إذا كان Nest غير مشغّل أو المنفذ غير مستجيب */
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
  const url = `${WORKFORCE_API_BASE}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers
    },
    cache: "no-store",
    signal: withTimeout(init?.signal ?? undefined, WORKFORCE_FETCH_TIMEOUT_MS)
  });

  const text = await response.text();
  if (!response.ok) {
    let msg = `${response.status} ${response.statusText}`;
    try {
      const j = JSON.parse(text) as { success?: boolean; message?: string | string[] };
      if (typeof j.message === "string") msg = j.message;
      else if (Array.isArray(j.message)) msg = j.message.join(", ");
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
    requestJson<PaginatedResponse<unknown>>(`/workforce/employees${buildQuery({ ...params, withRelations: true })}`),

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
    const [halls, departments, shifts, jobRoles, statuses] = await Promise.all([
      fetchAllPaged<Record<string, unknown>>("/workforce/halls"),
      fetchAllPaged<Record<string, unknown>>("/workforce/departments"),
      fetchAllPaged<Record<string, unknown>>("/workforce/shifts"),
      fetchAllPaged<Record<string, unknown>>("/workforce/job-roles"),
      fetchAllPaged<Record<string, unknown>>("/workforce/employee-statuses")
    ]);
    return { halls, departments, shifts, jobRoles, statuses };
  }
};
