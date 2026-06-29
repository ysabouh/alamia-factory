import { getLaravelApiBaseUrl } from "@/lib/api/resolve-api-base";
import { readStoredToken } from "@/lib/auth/factory-auth-api";

export class ProductionApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ProductionApiError";
  }
}

export type WorkOrderStatus = "draft" | "running" | "paused" | "completed" | "cancelled";
export type WorkOrderWorkerRole = "operator" | "helper" | "packer" | "shift_leader";
export type ChecklistItemType = "numeric" | "boolean" | "text" | "selection";
export type InspectionStatus = "passed" | "warning" | "failed";
export type InspectionResultStatus = "pass" | "fail" | "warning";

export type ProductionListMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type WorkOrderWorkerEmployeeJson = {
  id: string;
  fullName: string;
  employeeNumber: string;
  birthDate?: string | null;
  age?: number | null;
  profileImage?: string | null;
};

export type WorkOrderWorkerJson = {
  id: string;
  employeeId: string;
  employeeName?: string | null;
  role: WorkOrderWorkerRole;
  effectiveFrom?: string | null;
  createdAt?: string | null;
  createdByName?: string | null;
  removedAt?: string | null;
  removedByName?: string | null;
  isActive?: boolean;
  employee?: WorkOrderWorkerEmployeeJson | null;
};

export type ProductionLogJson = {
  id: string;
  fromTime: string | null;
  toTime: string | null;
  goodQuantity: number;
  scrapQuantity: number;
  notes?: string | null;
  createdByName?: string | null;
  createdAt: string | null;
};

export type QualityChecklistItemJson = {
  id: string;
  checklistId: string;
  itemName: string;
  itemType: ChecklistItemType;
  minValue: number | null;
  maxValue: number | null;
  unit: string | null;
  selectionOptions: string[] | null;
  sortOrder: number;
  isRequired: boolean;
  isCritical: boolean;
};

export type QualityChecklistJson = {
  id: string;
  productId: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  items: QualityChecklistItemJson[];
  createdAt: string | null;
};

export type QualityInspectionResultJson = {
  id: string;
  checklistItemId: string;
  itemName?: string | null;
  itemType?: ChecklistItemType | null;
  measuredValue: string | number | boolean | null;
  resultStatus: InspectionResultStatus;
  notes?: string | null;
};

export type QualityInspectionPhotoJson = {
  id: string;
  filePath: string;
  fileName: string;
  uploadedAt: string | null;
};

export type QualityInspectionDefectJson = {
  id: string;
  defectId: string;
  defectCode?: string | null;
  defectName?: string | null;
  quantity: number;
  notes?: string | null;
};

export type QualityInspectionJson = {
  id: string;
  workOrderId: string | null;
  qualityEmployeeId: string | null;
  qualityEmployeeName?: string | null;
  inspectionTime: string | null;
  status: InspectionStatus;
  sampleSize: number | null;
  notes?: string | null;
  correctiveAction?: string | null;
  isFinal: boolean;
  results: QualityInspectionResultJson[];
  photos: QualityInspectionPhotoJson[];
  defects: QualityInspectionDefectJson[];
  createdAt: string | null;
};

export type QualityDefectCatalogJson = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
};

export type MachineDowntimePhotoJson = {
  id: string;
  filePath: string;
  fileName: string;
  uploadedAt: string | null;
};

export type MachineDowntimeJson = {
  id: string;
  workOrderId: string | null;
  machineId: string;
  startTime: string | null;
  endTime: string | null;
  downtimeMinutes: number | null;
  downtimeReasonId: string | null;
  reasonCode?: string | null;
  reasonName?: string | null;
  notes?: string | null;
  faultDescription?: string | null;
  repairMethod?: string | null;
  maintenanceTicketId?: string | null;
  requestNo?: string | null;
  photos: MachineDowntimePhotoJson[];
};

export type DowntimeReasonJson = {
  id: string;
  code: string;
  name: string;
};

export type WorkOrderJson = {
  id: string;
  orderNo: string;
  code: string;
  productId: string;
  productCode?: string | null;
  productName?: string | null;
  productImageUrl?: string | null;
  productionDate: string | null;
  machineId: string | null;
  machineCode?: string | null;
  machineName?: string | null;
  machineBrand?: string | null;
  machineModel?: string | null;
  machineImageUrl?: string | null;
  machineTypeId?: string | null;
  machineTypeName?: string | null;
  moldId: string | null;
  moldCode?: string | null;
  moldName?: string | null;
  moldImageUrl?: string | null;
  moldType?: string | null;
  shiftId: string | null;
  shiftName?: string | null;
  supervisorId: string | null;
  supervisorName?: string | null;
  productionManagerId: string | null;
  productionManagerName?: string | null;
  plannedQuantity: number;
  producedQuantity: number;
  priority: string | null;
  status: WorkOrderStatus;
  dueDate: string | null;
  startTime: string | null;
  endTime: string | null;
  productOperationId: string | null;
  notes?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type WorkOrderDetailJson = WorkOrderJson & {
  workers: WorkOrderWorkerJson[];
  logs: ProductionLogJson[];
  inspections: QualityInspectionJson[];
  downtimes: MachineDowntimeJson[];
};

export type ProductionDashboardKpisJson = {
  period: { from: string; to: string };
  orders: { total: number; running: number; completed: number; paused: number };
  production: {
    daily: Array<{ date: string; goodQuantity: number; scrapQuantity: number }>;
    byMachine: Array<{ machineId: string; machineCode: string; goodQuantity: number }>;
    byShift: Array<{ shiftId: string; shiftName: string; goodQuantity: number }>;
    byWorker: Array<{ employeeId: string; employeeName: string; role: string; goodQuantity: number }>;
  };
  quality: {
    totalInspections: number;
    passRate: number;
    failRate: number;
    topDefects: Array<{ code: string; name: string; quantity: number }>;
  };
  downtime: {
    events: number;
    totalMinutes: number;
    byReason: Array<{ reason: string; events: number; minutes: number }>;
  };
  maintenance: {
    openTickets: number;
    closedTickets: number;
    avgMttrMinutes: number;
  };
};

export type WorkOrderPayload = {
  orderNo?: string;
  productId: string;
  productionDate?: string;
  machineId?: string;
  moldId?: string;
  shiftId?: string;
  supervisorId?: string;
  productionManagerId?: string;
  plannedQuantity: number;
  priority?: string;
  dueDate?: string;
  productOperationId?: string;
  notes?: string;
  workers?: Array<{ employeeId: string; role?: WorkOrderWorkerRole }>;
};

export type ProductionLogPayload = {
  fromTime: string;
  toTime: string;
  goodQuantity: number;
  scrapQuantity?: number;
  notes?: string;
};

export type QualityInspectionPayload = {
  qualityEmployeeId?: string;
  inspectionTime?: string;
  sampleSize?: number;
  notes?: string;
  correctiveAction?: string;
  isFinal?: boolean;
  results?: Array<{
    checklistItemId: string;
    measuredValue?: string | number | boolean | null;
    resultStatus?: InspectionResultStatus;
    notes?: string;
  }>;
  defects?: Array<{ defectId: string; quantity?: number; notes?: string }>;
};

type ListParams = {
  page?: number;
  pageSize?: number;
  status?: WorkOrderStatus | "all";
  machineId?: string;
  shiftId?: string;
  productId?: string;
  from?: string;
  to?: string;
  search?: string;
};

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

function buildHeaders(init?: RequestInit): HeadersInit {
  const isForm = init?.body instanceof FormData;
  const token = readStoredToken();
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isForm ? { "Content-Type": "application/json" } : {}),
    ...(init?.headers ?? {})
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getLaravelApiBaseUrl()}${path}`, {
    ...init,
    headers: buildHeaders(init)
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string; errors?: Record<string, string[]> };
      if (body.message) msg = body.message;
      if (body.errors) {
        const first = Object.values(body.errors).flat()[0];
        if (first) msg = first;
      }
    } catch {
      /* ignore */
    }
    throw new ProductionApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const productionApi = {
  listOrders(params?: ListParams) {
    return request<{ data: WorkOrderJson[]; meta: ProductionListMeta }>(
      `/production/orders${buildQuery({
        page: params?.page,
        pageSize: params?.pageSize,
        status: params?.status === "all" ? undefined : params?.status,
        machineId: params?.machineId,
        shiftId: params?.shiftId,
        productId: params?.productId,
        from: params?.from,
        to: params?.to,
        search: params?.search
      })}`
    );
  },

  showOrder(id: string) {
    return request<{ data: WorkOrderDetailJson }>(`/production/orders/${id}`);
  },

  createOrder(payload: WorkOrderPayload) {
    return request<{ data: WorkOrderDetailJson }>("/production/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  updateOrder(id: string, payload: Partial<WorkOrderPayload>) {
    return request<{ data: WorkOrderDetailJson }>(`/production/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  startOrder(id: string) {
    return request<{ data: WorkOrderDetailJson }>(`/production/orders/${id}/start`, { method: "POST" });
  },

  pauseOrder(id: string) {
    return request<{ data: WorkOrderDetailJson }>(`/production/orders/${id}/pause`, { method: "POST" });
  },

  resumeOrder(id: string) {
    return request<{ data: WorkOrderDetailJson }>(`/production/orders/${id}/resume`, { method: "POST" });
  },

  completeOrder(id: string) {
    return request<{ data: WorkOrderDetailJson }>(`/production/orders/${id}/complete`, { method: "POST" });
  },

  cancelOrder(id: string) {
    return request<{ data: WorkOrderDetailJson }>(`/production/orders/${id}/cancel`, { method: "POST" });
  },

  addWorker(orderId: string, payload: { employeeId: string; role?: WorkOrderWorkerRole; effectiveFrom?: string }) {
    return request<{ data: WorkOrderWorkerJson }>(`/production/orders/${orderId}/workers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  removeWorker(orderId: string, workerId: string) {
    return request<void>(`/production/orders/${orderId}/workers/${workerId}`, { method: "DELETE" });
  },

  listWorkersHistory(orderId: string) {
    return request<{ data: WorkOrderWorkerJson[] }>(`/production/orders/${orderId}/workers/history`);
  },

  listLogs(orderId: string) {
    return request<{ data: ProductionLogJson[] }>(`/production/orders/${orderId}/logs`);
  },

  createLog(orderId: string, payload: ProductionLogPayload) {
    return request<{ data: ProductionLogJson }>(`/production/orders/${orderId}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  dashboardKpis(params?: { from?: string; to?: string; machineId?: string; shiftId?: string }) {
    return request<{ data: ProductionDashboardKpisJson }>(
      `/production/dashboard/kpis${buildQuery({
        from: params?.from,
        to: params?.to,
        machineId: params?.machineId,
        shiftId: params?.shiftId
      })}`
    );
  },

  listInspections(orderId: string) {
    return request<{ data: QualityInspectionJson[] }>(`/production/orders/${orderId}/inspections`);
  },

  createInspection(orderId: string, payload: QualityInspectionPayload) {
    return request<{ data: QualityInspectionJson }>(`/production/orders/${orderId}/inspections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  showInspection(id: string) {
    return request<{ data: QualityInspectionJson }>(`/quality-inspections/${id}`);
  },

  updateInspection(id: string, payload: QualityInspectionPayload) {
    return request<{ data: QualityInspectionJson }>(`/quality-inspections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  uploadInspectionPhoto(inspectionId: string, file: File) {
    const fd = new FormData();
    fd.append("photo", file);
    return request<{ data: QualityInspectionPhotoJson }>(`/quality-inspections/${inspectionId}/photos`, {
      method: "POST",
      body: fd
    });
  },

  replaceInspectionPhoto(photoId: string, file: File) {
    const fd = new FormData();
    fd.append("photo", file);
    return request<{ data: QualityInspectionPhotoJson }>(`/quality-inspection-photos/${photoId}/replace`, {
      method: "POST",
      body: fd
    });
  },

  deleteInspectionPhoto(photoId: string) {
    return request<{ deleted: boolean }>(`/quality-inspection-photos/${photoId}/delete`, { method: "POST" });
  },

  defectsCatalog() {
    return request<{ data: QualityDefectCatalogJson[] }>("/quality/defects");
  },

  listChecklists(productId: string) {
    return request<{ data: QualityChecklistJson[] }>(`/products/${productId}/quality-checklists`);
  },

  createChecklist(productId: string, payload: { name: string; description?: string; isActive?: boolean; items?: Array<Partial<QualityChecklistItemJson>> }) {
    return request<{ data: QualityChecklistJson }>(`/products/${productId}/quality-checklists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  updateChecklist(checklistId: string, payload: { name?: string; description?: string; isActive?: boolean }) {
    return request<{ data: QualityChecklistJson }>(`/quality-checklists/${checklistId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  deleteChecklist(checklistId: string) {
    return request<void>(`/quality-checklists/${checklistId}`, { method: "DELETE" });
  },

  addChecklistItem(checklistId: string, payload: Partial<QualityChecklistItemJson> & { itemName: string }) {
    return request<{ data: QualityChecklistItemJson }>(`/quality-checklists/${checklistId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  updateChecklistItem(itemId: string, payload: Partial<QualityChecklistItemJson> & { itemName?: string }) {
    return request<{ data: QualityChecklistItemJson }>(`/quality-checklist-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  listDowntimes(orderId: string) {
    return request<{ data: MachineDowntimeJson[] }>(`/production/orders/${orderId}/downtimes`);
  },

  createDowntime(
    orderId: string,
    payload: {
      machineId: string;
      startTime: string;
      endTime?: string;
      downtimeReasonId: string;
      notes?: string;
    }
  ) {
    return request<{ data: MachineDowntimeJson }>(`/production/orders/${orderId}/downtimes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  updateDowntime(
    downtimeId: string,
    payload: {
      downtimeReasonId?: string;
      startTime?: string;
      endTime?: string;
      notes?: string;
      faultDescription?: string;
      repairMethod?: string;
    }
  ) {
    return request<{ data: MachineDowntimeJson }>(`/machine-downtimes/${downtimeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  uploadDowntimePhoto(downtimeId: string, file: File) {
    const fd = new FormData();
    fd.append("photo", file);
    return request<{ data: MachineDowntimePhotoJson }>(`/machine-downtimes/${downtimeId}/photos`, {
      method: "POST",
      body: fd
    });
  },

  replaceDowntimePhoto(photoId: string, file: File) {
    const fd = new FormData();
    fd.append("photo", file);
    return request<{ data: MachineDowntimePhotoJson }>(`/machine-downtime-photos/${photoId}/replace`, {
      method: "POST",
      body: fd
    });
  },

  deleteDowntimePhoto(photoId: string) {
    return request<{ deleted: boolean }>(`/machine-downtime-photos/${photoId}/delete`, { method: "POST" });
  },

  downtimeReasons() {
    return request<{ data: DowntimeReasonJson[] }>("/downtime/reasons");
  },

  requestMaintenance(downtimeId: string) {
    return request<{ data: { id: string; requestNo?: string } }>(`/machine-downtimes/${downtimeId}/maintenance-request`, {
      method: "POST"
    });
  }
};
