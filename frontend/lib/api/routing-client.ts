import { getLaravelApiBaseUrl } from "@/lib/api/resolve-api-base";
import { authFetchHeaders } from "@/lib/auth/factory-auth-api";

export class RoutingApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "RoutingApiError";
  }
}

export type OperationType =
  | "injection"
  | "blow"
  | "compression"
  | "assembly"
  | "packaging"
  | "labeling"
  | "inspection"
  | "cooling"
  | "trimming"
  | "printing";

export type ManufacturingMode = "manufactured" | "assembled" | "hybrid" | "purchased";

export type OperationMachineSettingJson = {
  id?: string;
  machineId: string;
  machineCode?: string | null;
  machineName?: string | null;
  injectionPressure?: number | null;
  holdingPressure?: number | null;
  coolingTime?: number | null;
  moldTemperature?: number | null;
  barrelTemperatureProfile?: number[] | null;
  clampForce?: number | null;
  shotWeight?: number | null;
  screwSpeed?: number | null;
  backPressure?: number | null;
  setupNotes?: string | null;
};

export type OperationMaterialConsumptionJson = {
  id?: string;
  materialProductId: string;
  materialProductCode?: string | null;
  materialProductName?: string | null;
  plannedQuantity: number;
  actualQuantity?: number | null;
  wasteQuantity?: number | null;
};

export type OperationQualitySpecJson = {
  id?: string;
  inspectionType: string;
  toleranceMin?: number | null;
  toleranceMax?: number | null;
  inspectionFrequency?: string | null;
  qcNotes?: string | null;
};

export type ProductOperationJson = {
  id: string;
  productId: string;
  operationCode: string;
  operationName: string;
  operationType: OperationType;
  sequenceOrder: number;
  machineId?: string | null;
  machineCode?: string | null;
  machineName?: string | null;
  moldId?: string | null;
  moldCode?: string | null;
  moldName?: string | null;
  workCenterId?: string | null;
  workCenterName?: string | null;
  setupTime?: number | null;
  cycleTime?: number | null;
  laborTime?: number | null;
  coolingTime?: number | null;
  operationInstructions?: string | null;
  qcRequired: boolean;
  isActive: boolean;
  machineSettings: OperationMachineSettingJson[];
  materialConsumptions: OperationMaterialConsumptionJson[];
  qualitySpecs: OperationQualitySpecJson[];
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type RoutingFlowStep =
  | {
      kind: "materials";
      label: string;
      items: Array<{
        productId: string;
        productCode?: string | null;
        productName?: string | null;
        componentType?: string;
        quantity: number;
      }>;
    }
  | {
      kind: "operation";
      label: string;
      operationType: OperationType;
      operationId: string;
    };

export type ProductRoutingJson = {
  productId: string;
  manufacturingMode: ManufacturingMode;
  operations: Array<Omit<ProductOperationJson, "machineSettings" | "materialConsumptions" | "qualitySpecs">>;
  flow: RoutingFlowStep[];
  assignedMachines: Array<{
    machineId: string;
    machineCode?: string | null;
    machineName?: string | null;
    operationIds: string[];
  }>;
  assignedMolds: Array<{
    moldId: string;
    moldCode?: string | null;
    moldName?: string | null;
    operationIds: string[];
  }>;
  machineParameters: Array<{
    operationId: string;
    operationName: string;
    machineId: string;
    machineCode?: string | null;
    machineName?: string | null;
    injectionPressure?: number | null;
    holdingPressure?: number | null;
    coolingTime?: number | null;
    moldTemperature?: number | null;
    barrelTemperatureProfile?: number[] | null;
    clampForce?: number | null;
    shotWeight?: number | null;
    screwSpeed?: number | null;
    setupNotes?: string | null;
  }>;
  qcSpecifications: Array<{
    operationId: string;
    operationName: string;
    inspectionType: string;
    toleranceMin?: number | null;
    toleranceMax?: number | null;
    inspectionFrequency?: string | null;
    qcNotes?: string | null;
  }>;
  packagingOperations: Array<{
    id: string;
    operationCode: string;
    operationName: string;
    operationType: OperationType;
    sequenceOrder: number;
  }>;
  bomComponentCount: number;
  operationCount: number;
};

export type ProductOperationPayload = {
  operationCode: string;
  operationName: string;
  operationType: OperationType;
  sequenceOrder?: number;
  machineId?: string;
  moldId?: string;
  workCenterId?: string;
  setupTime?: number;
  cycleTime?: number;
  laborTime?: number;
  coolingTime?: number;
  operationInstructions?: string;
  qcRequired?: boolean;
  isActive?: boolean;
  machineSettings?: OperationMachineSettingJson[];
  materialConsumptions?: OperationMaterialConsumptionJson[];
  qualitySpecs?: OperationQualitySpecJson[];
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
    throw new RoutingApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const routingApi = {
  operations(productId: string) {
    return request<{ data: ProductOperationJson[] }>(`/products/${productId}/operations`);
  },

  routing(productId: string) {
    return request<{ data: ProductRoutingJson }>(`/products/${productId}/routing`);
  },

  createOperation(productId: string, payload: ProductOperationPayload) {
    return request<{ data: ProductOperationJson }>(`/products/${productId}/operations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  updateOperation(operationId: string, payload: Partial<ProductOperationPayload>) {
    return request<{ data: ProductOperationJson }>(`/product-operations/${operationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  deleteOperation(operationId: string) {
    return request<void>(`/product-operations/${operationId}`, { method: "DELETE" });
  }
};
