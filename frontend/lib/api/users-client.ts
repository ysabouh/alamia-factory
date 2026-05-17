import { getLaravelApiBaseUrl } from "@/lib/api/resolve-api-base";
import { authFetchHeaders } from "@/lib/auth/factory-auth-api";

export type SystemUserJson = {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  employeeId: number | null;
  roles: string[];
  permissions: string[];
  employee: {
    id: string;
    employeeNumber: string;
    fullName: string;
    email: string | null;
  } | null;
};

export type PermissionsCatalog = {
  permissions: string[];
  roles: { name: string; permissions: string[] }[];
};

export class UsersApiError extends Error {
  readonly status: number;
  readonly existingUser?: SystemUserJson;

  constructor(status: number, message: string, existingUser?: SystemUserJson) {
    super(message);
    this.name = "UsersApiError";
    this.status = status;
    this.existingUser = existingUser;
  }
}

function unwrapUser(payload: SystemUserJson | { user?: SystemUserJson; message?: string }): SystemUserJson {
  if (payload && typeof payload === "object" && "user" in payload && payload.user) {
    return payload.user;
  }
  return payload as SystemUserJson;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getLaravelApiBaseUrl()}${path}`, {
    ...init,
    headers: { ...authFetchHeaders(), ...init?.headers },
    cache: "no-store"
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text.slice(0, 200);
    let existingUser: SystemUserJson | undefined;
    try {
      const j = JSON.parse(text) as { message?: string; user?: SystemUserJson };
      if (j.message) msg = j.message;
      if (j.user && typeof j.user.id === "number") existingUser = j.user;
    } catch {
      /* ignore */
    }
    throw new UsersApiError(res.status, msg, existingUser);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

export const usersApi = {
  list: (params?: {
    search?: string;
    employeeId?: string;
    unlinkedOnly?: boolean;
    page?: number;
    pageSize?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.employeeId) q.set("employeeId", params.employeeId);
    if (params?.unlinkedOnly) q.set("unlinkedOnly", "1");
    if (params?.page) q.set("page", String(params.page));
    if (params?.pageSize) q.set("pageSize", String(params.pageSize));
    const qs = q.toString();
    return request<{ data: SystemUserJson[]; meta: { page: number; total: number; totalPages: number } }>(
      `/users${qs ? `?${qs}` : ""}`
    );
  },

  catalog: () => request<PermissionsCatalog>("/users/permissions-catalog"),

  update: async (id: number, body: Record<string, unknown>) => {
    const raw = await request<SystemUserJson | { user: SystemUserJson }>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body)
    });
    return unwrapUser(raw);
  },

  linkEmployee: async (body: {
    employeeId: string;
    email: string;
    password: string;
    roles?: string[];
  }) => {
    const raw = await request<SystemUserJson | { user: SystemUserJson }>("/users/link-employee", {
      method: "POST",
      body: JSON.stringify(body)
    });
    return unwrapUser(raw);
  },

  linkExistingUser: async (body: { employeeId: string; userId: number; roles?: string[] }) => {
    const raw = await request<SystemUserJson | { user: SystemUserJson }>("/users/link-existing", {
      method: "POST",
      body: JSON.stringify(body)
    });
    return unwrapUser(raw);
  }
};

export function systemUserToEmployeePatch(u: SystemUserJson): {
  systemUser: {
    id: number;
    email: string;
    name: string;
    isActive: boolean;
    roles: string[];
    permissions: string[];
  };
} {
  return {
    systemUser: {
      id: u.id,
      email: u.email,
      name: u.name,
      isActive: u.isActive,
      roles: u.roles,
      permissions: u.permissions
    }
  };
}
