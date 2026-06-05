import { getLaravelApiBaseUrl } from "@/lib/api/resolve-api-base";
import { authFetchHeaders } from "@/lib/auth/factory-auth-api";

export class MachinesApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "MachinesApiError";
  }
}

export type MachineRegistryStatus = "running" | "stopped" | "maintenance" | "breakdown";

export type MachineListMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type MachineTypeJson = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

export type InjectionSpecJson = {
  clampingForceTon: number | null;
  shotWeightGram: number | null;
  screwDiameterMm: number | null;
  injectionPressureBar: number | null;
  heatingZonesCount: number | null;
  maxCycleTimeSec: number | null;
};

export type BlowSpecJson = {
  bottleVolumeMinMl: number | null;
  bottleVolumeMaxMl: number | null;
  cavitiesCount: number | null;
  airPressureBar: number | null;
  productionCapacityBph: number | null;
};

export type MachineJson = {
  id: string;
  code: string;
  name: string;
  machineTypeId: string;
  type: string | null;
  typeName: string | null;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  factorySection: string | null;
  productionLine: string | null;
  powerKw: number | null;
  hourlyEnergyConsumption: number | null;
  installationDate: string | null;
  notes: string | null;
  isActive: boolean;
  status: MachineRegistryStatus;
  statusNote: string | null;
  lastStatusChangedAt: string | null;
  todayProducedUnits: number;
  openBreakdownCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type MachineDetailJson = MachineJson & {
  spec: InjectionSpecJson | BlowSpecJson | null;
  activeAssignment: { id: string; mold: string | null } | null;
  recentTickets: MaintenanceTicketJson[];
};

export type MachineCounterJson = {
  id: string;
  machineId: string;
  counterDate: string;
  producedUnits: number;
  rejectedUnits: number;
  runningHours: number;
};

export type MaintenanceTicketJson = {
  id: string;
  machineId: string;
  ticketKind: "breakdown" | "maintenance";
  severity: string;
  status: string;
  title: string;
  description: string | null;
  failureDate: string | null;
  downtimeStartedAt: string | null;
  downtimeEndedAt: string | null;
  resolvedAt: string | null;
  downtimeMinutes: number | null;
  assignedTechnicianName: string | null;
  createdAt: string | null;
};

export type MaintenanceActionJson = {
  id: string;
  maintenanceTicketId: string;
  maintenanceType: "preventive" | "corrective" | "emergency";
  maintenanceDate: string | null;
  technicianId: string | null;
  technicianName: string | null;
  actionTaken: string;
  timeSpentMinutes: number | null;
  cost: number | null;
  notes: string | null;
  createdAt: string | null;
};

export type PreventiveLogJson = {
  id: string;
  planName: string | null;
  performedAt: string | null;
  technicianName: string | null;
  notes: string | null;
};

export type MachinePayload = {
  machineTypeId: string;
  code: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  factorySection?: string | null;
  productionLine?: string | null;
  powerKw?: number | null;
  hourlyEnergyConsumption?: number | null;
  installationDate?: string | null;
  notes?: string | null;
  isActive?: boolean;
  status?: MachineRegistryStatus;
  spec?: Record<string, unknown> | null;
};

type ListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  status?: MachineRegistryStatus;
  isActive?: boolean | "all";
  sort?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getLaravelApiBaseUrl()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...authFetchHeaders(), ...init?.headers },
    cache: "no-store"
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text.slice(0, 240);
    try {
      const j = JSON.parse(text) as { message?: string };
      if (j.message) msg = j.message;
    } catch {
      /* ignore */
    }
    throw new MachinesApiError(res.status, msg);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

function buildQuery(params?: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams();
  if (!params) return "";
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const machinesApi = {
  listTypes(params?: { search?: string; isActive?: boolean | "all" }) {
    const isActive =
      params?.isActive === undefined || params.isActive === "all"
        ? undefined
        : params.isActive
          ? "1"
          : "0";
    return request<{ data: MachineTypeJson[] }>(
      `/machines/types${buildQuery({ search: params?.search, isActive })}`
    );
  },

  list(params?: ListParams) {
    const isActive =
      params?.isActive === undefined || params.isActive === "all"
        ? undefined
        : params.isActive
          ? "1"
          : "0";
    return request<{ data: MachineJson[]; meta: MachineListMeta }>(
      `/machines${buildQuery({
        page: params?.page,
        pageSize: params?.pageSize,
        search: params?.search,
        type: params?.type,
        status: params?.status,
        isActive,
        sort: params?.sort
      })}`
    );
  },

  show(id: string) {
    return request<{ data: MachineDetailJson }>(`/machines/${id}`);
  },

  create(payload: MachinePayload) {
    return request<{ data: MachineDetailJson }>("/machines", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  update(id: string, payload: Partial<MachinePayload>) {
    return request<{ data: MachineDetailJson }>(`/machines/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },

  remove(id: string) {
    return request<{ deleted: boolean }>(`/machines/${id}`, { method: "DELETE" });
  },

  listCounters(machineId: string, params?: { from?: string; to?: string }) {
    return request<{ data: MachineCounterJson[] }>(
      `/machines/${machineId}/counters${buildQuery(params)}`
    );
  },

  upsertCounter(
    machineId: string,
    payload: {
      counterDate: string;
      producedUnits: number;
      rejectedUnits?: number;
      runningHours?: number;
    }
  ) {
    return request<{ data: MachineCounterJson }>(`/machines/${machineId}/counters`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  listTickets(
    machineId: string,
    params?: { kind?: "breakdown" | "maintenance"; status?: string; from?: string; to?: string }
  ) {
    return request<{ data: MaintenanceTicketJson[] }>(
      `/machines/${machineId}/tickets${buildQuery({ kind: params?.kind, status: params?.status, from: params?.from, to: params?.to })}`
    );
  },

  createTicket(
    machineId: string,
    payload: {
      ticketKind?: "breakdown" | "maintenance";
      title: string;
      description?: string;
      severity?: string;
      failureDate?: string;
    }
  ) {
    return request<{ data: MaintenanceTicketJson }>(`/machines/${machineId}/tickets`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  updateTicket(
    machineId: string,
    ticketId: string,
    payload: { status?: string; title?: string; description?: string; downtimeMinutes?: number }
  ) {
    return request<{ data: MaintenanceTicketJson }>(`/machines/${machineId}/tickets/${ticketId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },

  listActions(machineId: string, params?: { type?: string }) {
    return request<{ data: MaintenanceActionJson[] }>(
      `/machines/${machineId}/maintenance-actions${buildQuery({ type: params?.type })}`
    );
  },

  createAction(
    machineId: string,
    ticketId: string,
    payload: {
      maintenanceType?: string;
      maintenanceDate?: string;
      actionTaken: string;
      timeSpentMinutes?: number;
      cost?: number;
      notes?: string;
    }
  ) {
    return request<{ data: MaintenanceActionJson }>(
      `/machines/${machineId}/tickets/${ticketId}/actions`,
      {
        method: "POST",
        body: JSON.stringify(payload)
      }
    );
  },

  listPreventiveLogs(machineId: string) {
    return request<{ data: PreventiveLogJson[] }>(`/machines/${machineId}/preventive-logs`);
  }
};
