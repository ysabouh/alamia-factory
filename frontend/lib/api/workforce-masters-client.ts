import { getLaravelApiBaseUrl } from "@/lib/api/resolve-api-base";
import { WorkforceApiError } from "@/lib/api/workforce-client";

export { WorkforceApiError };
import { authFetchHeaders } from "@/lib/auth/factory-auth-api";

export type MasterResource = "halls" | "departments" | "job-roles" | "shifts" | "currencies";

export type MasterListMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type HallMaster = {
  id: string;
  name: string;
  code: string;
  hallType: string | null;
  description: string | null;
  isActive: boolean;
};

export type DepartmentMaster = {
  id: string;
  name: string;
  code: string;
  hallId: string | null;
  hallName?: string | null;
  hallCode?: string | null;
  parentId?: string | null;
  parentName?: string | null;
  parentCode?: string | null;
  isLeaf?: boolean;
  description: string | null;
  vacancyCount?: number;
  managerId?: string | null;
  managerName?: string | null;
  isActive: boolean;
};

export type JobRoleMaster = {
  id: string;
  name: string;
  code: string;
  roleLevel: number;
  description: string | null;
  isActive: boolean;
};

export type ShiftMaster = {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  description: string | null;
  isActive: boolean;
};

export type CurrencyMaster = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  usdExchangeRate: number;
  isBase: boolean;
  isActive: boolean;
};

export type MasterRow = HallMaster | DepartmentMaster | JobRoleMaster | ShiftMaster | CurrencyMaster;

type ListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean | "all";
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getLaravelApiBaseUrl()}${path}`, {
    ...init,
    headers: { ...authFetchHeaders(), ...init?.headers },
    cache: "no-store"
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text.slice(0, 200);
    try {
      const j = JSON.parse(text) as { message?: string };
      if (j.message) msg = j.message;
    } catch {
      /* ignore */
    }
    throw new WorkforceApiError(res.status, msg);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

function buildQuery(params?: ListParams): string {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.pageSize) q.set("pageSize", String(params.pageSize));
  if (params?.search) q.set("search", params.search);
  if (params?.isActive !== undefined && params.isActive !== "all") {
    q.set("isActive", params.isActive ? "1" : "0");
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

function unwrapData<T>(raw: T | { data: T }): T {
  if (raw && typeof raw === "object" && "data" in raw) {
    return (raw as { data: T }).data;
  }
  return raw as T;
}

export const workforceMastersApi = {
  list: async <T>(resource: MasterResource, params?: ListParams) => {
    const raw = await request<{ data: T[]; meta: MasterListMeta }>(
      `/workforce/masters/${resource}${buildQuery(params)}`
    );
    return raw;
  },

  create: async <T>(resource: MasterResource, body: Record<string, unknown>) => {
    const raw = await request<{ data: T; message?: string }>(`/workforce/masters/${resource}`, {
      method: "POST",
      body: JSON.stringify(body)
    });
    return unwrapData(raw);
  },

  update: async <T>(resource: MasterResource, id: string, body: Record<string, unknown>) => {
    const raw = await request<{ data: T; message?: string }>(`/workforce/masters/${resource}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body)
    });
    return unwrapData(raw);
  },

  activate: async <T>(resource: MasterResource, id: string) => {
    const raw = await request<{ data: T }>(
      `/workforce/masters/${resource}/${encodeURIComponent(id)}/activate`,
      { method: "PATCH" }
    );
    return unwrapData(raw);
  },

  deactivate: async <T>(resource: MasterResource, id: string) => {
    const raw = await request<{ data: T }>(
      `/workforce/masters/${resource}/${encodeURIComponent(id)}/deactivate`,
      { method: "PATCH" }
    );
    return unwrapData(raw);
  },

  listHallsForSelect: async () => {
    const res = await workforceMastersApi.list<HallMaster>("halls", { pageSize: 100, isActive: true });
    return res.data;
  },

  getDepartmentTree: async () => {
    const raw = await request<{ data: import("@/features/workforce/employee-management/org-chart/org-chart-types").DepartmentTreeNode[] }>(
      "/workforce/masters/departments/tree"
    );
    return raw.data;
  },

  listOrgPositions: async (departmentId: string) => {
    const raw = await request<{
      data: import("@/features/workforce/employee-management/org-chart/org-chart-types").DepartmentOrgPositionJson[];
      meta: { isLeaf: boolean };
    }>(`/workforce/masters/departments/${encodeURIComponent(departmentId)}/org-positions`);
    return raw;
  },

  createOrgPosition: async (departmentId: string, body: Record<string, unknown>) => {
    const raw = await request<{ data: import("@/features/workforce/employee-management/org-chart/org-chart-types").DepartmentOrgPositionJson }>(
      `/workforce/masters/departments/${encodeURIComponent(departmentId)}/org-positions`,
      { method: "POST", body: JSON.stringify(body) }
    );
    return unwrapData(raw);
  },

  updateOrgPosition: async (departmentId: string, positionId: string, body: Record<string, unknown>) => {
    const raw = await request<{ data: import("@/features/workforce/employee-management/org-chart/org-chart-types").DepartmentOrgPositionJson }>(
      `/workforce/masters/departments/${encodeURIComponent(departmentId)}/org-positions/${encodeURIComponent(positionId)}`,
      { method: "PATCH", body: JSON.stringify(body) }
    );
    return unwrapData(raw);
  },

  deleteOrgPosition: async (departmentId: string, positionId: string) => {
    await request(`/workforce/masters/departments/${encodeURIComponent(departmentId)}/org-positions/${encodeURIComponent(positionId)}`, {
      method: "DELETE"
    });
  }
};
