import { getLaravelApiBaseUrl } from "@/lib/api/resolve-api-base";
import { authFetchHeaders } from "@/lib/auth/factory-auth-api";
import type { ProductBomLineJson } from "@/lib/api/products-client";

export class AssemblyApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "AssemblyApiError";
  }
}

export type BomComponentType =
  | "raw_material"
  | "component"
  | "subassembly"
  | "packaging"
  | "consumable";

export type BomTreeNode = ProductBomLineJson & {
  assemblyType?: string | null;
  standardCost?: number | null;
  children?: BomTreeNode[];
};

export type AssemblyWorkOrderStatus = "draft" | "planned" | "in_progress" | "completed" | "cancelled";

export type AssemblyWorkOrderJson = {
  id: string;
  workOrderCode: string;
  finalProductId: string;
  finalProductCode?: string | null;
  finalProductName?: string | null;
  plannedQuantity: number;
  completedQuantity: number;
  status: AssemblyWorkOrderStatus;
  plannedStartDate?: string | null;
  plannedEndDate?: string | null;
  progressPercent: number;
  notes?: string | null;
};

export type AssemblyDashboardJson = {
  activeOrders: number;
  completedToday: number;
  progressPercent: number;
  ordersWithShortages: number;
  throughputUnits: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getLaravelApiBaseUrl()}${path}`, {
    ...init,
    headers: { ...authFetchHeaders(), ...(init?.headers ?? {}) }
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) msg = body.message;
    } catch {
      /* ignore */
    }
    throw new AssemblyApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const assemblyApi = {
  dashboard() {
    return request<{ data: AssemblyDashboardJson }>("/assembly/dashboard");
  },

  listWorkOrders(params?: { page?: number; pageSize?: number; status?: string }) {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.pageSize) q.set("pageSize", String(params.pageSize));
    if (params?.status) q.set("status", params.status);
    const s = q.toString();

    return request<{ data: AssemblyWorkOrderJson[]; meta: { total: number; page: number; pageSize: number } }>(
      `/assembly/work-orders${s ? `?${s}` : ""}`
    );
  },

  createWorkOrder(payload: {
    finalProductId: string;
    plannedQuantity: number;
    workOrderCode?: string;
    plannedStartDate?: string;
    plannedEndDate?: string;
    notes?: string;
  }) {
    return request<{ data: AssemblyWorkOrderJson }>("/assembly/work-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  workOrderAvailability(id: string) {
    return request<{
      data: { available: boolean; shortages: Array<{ productCode: string; productName: string; required: number; available: number; shortage: number }> };
    }>(`/assembly/work-orders/${id}/availability`);
  },

  recordOperation(payload: {
    assemblyWorkOrderId: string;
    quantityProduced: number;
    quantityRejected?: number;
    operatorId?: string;
    notes?: string;
  }) {
    return request<{ data: { id: string } }>("/assembly/operations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  bomTree(productId: string) {
    return request<{
      data: {
        tree: BomTreeNode[];
        costRollup: { unitCost: number; rolledUpCost: number; lines: Array<{ productCode: string; quantity: number; lineCost: number }> };
      };
    }>(`/products/${productId}/bom-tree`);
  },

  addBomLine(
    productId: string,
    line: {
      childProductId: string;
      quantity: number;
      componentType?: BomComponentType;
      wastePercentage?: number;
      isOptional?: boolean;
      sequenceOrder?: number;
      notes?: string;
    }
  ) {
    return request<{ data: ProductBomLineJson }>(`/products/${productId}/bom`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(line)
    });
  },

  updateBomLine(
    lineId: string,
    line: Partial<{
      childProductId: string;
      quantity: number;
      componentType: BomComponentType;
      wastePercentage: number;
      isOptional: boolean;
      sequenceOrder: number;
      notes: string;
    }>
  ) {
    return request<{ data: ProductBomLineJson }>(`/product-bom/${lineId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(line)
    });
  },

  deleteBomLine(lineId: string) {
    return request<void>(`/product-bom/${lineId}`, { method: "DELETE" });
  }
};
