import { getLaravelApiBaseUrl } from "@/lib/api/resolve-api-base";
import { authFetchHeaders } from "@/lib/auth/factory-auth-api";

export class MoldsApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "MoldsApiError";
  }
}

export type MoldType = "injection" | "pet_blow" | "compression" | "polyethylene";
export type MoldStatus = "active" | "maintenance" | "inactive";
export type MoldImageType = "photo" | "technical_drawing" | "exploded_diagram" | "maintenance_photo";
export type PolyethyleneType = "hdpe" | "ldpe" | "lldpe";
export type PeProductionMethod = "blow" | "rotational" | "extrusion";

export type MoldListMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ProductJson = {
  id: string;
  code: string;
  name: string;
  unit: string;
};

export type InjectionMoldSpecJson = {
  hotRunner?: boolean;
  runnerType?: string | null;
  gateType?: string | null;
  coolingCircuitCount?: number | null;
  ejectorSystemType?: string | null;
  maxInjectionPressure?: number | null;
  clampForceRequired?: number | null;
  cycleTime?: number | null;
  moldSteelType?: string | null;
  shrinkageRate?: number | null;
  corePullCount?: number | null;
  textureType?: string | null;
  supportedMaterials?: string[];
};

export type PetBlowMoldSpecJson = {
  blowType?: "extrusion" | "injection" | "stretch" | null;
  bottleVolumeMl?: number | null;
  neckDiameter?: number | null;
  coolingMethod?: string | null;
  airPressureRequired?: number | null;
  blowRatio?: number | null;
  parisonType?: string | null;
  coolingTime?: number | null;
  moldMaterial?: string | null;
  supportedPolymers?: string[];
  maxTemperature?: number | null;
};

export type CompressionMoldSpecJson = {
  compressionForce?: number | null;
  heatingType?: string | null;
  moldTemperature?: number | null;
  pressureTime?: number | null;
  curingTime?: number | null;
  moldMaterial?: string | null;
  heatingZones?: number | null;
  supportedMaterials?: string[];
  maxProductThickness?: number | null;
};

export type PolyethyleneMoldSpecJson = {
  polyethyleneType?: PolyethyleneType | null;
  productionMethod?: PeProductionMethod | null;
  tankVolume?: number | null;
  wallThickness?: number | null;
  coolingMethod?: string | null;
  moldMaterial?: string | null;
  heatingSystem?: string | null;
  cycleTime?: number | null;
  pressureRating?: number | null;
  supportedProducts?: string[];
  maxTemperature?: number | null;
  minTemperature?: number | null;
  moldLayers?: number | null;
  rotationalSpeed?: number | null;
  shrinkageRate?: number | null;
};

export type MoldImageJson = {
  id: string;
  moldId: string;
  imageUrl: string;
  imageType: MoldImageType | string | null;
  isPrimary: boolean;
  uploadedAt: string | null;
};

export type MoldMaintenanceLogJson = {
  id: string;
  maintenanceType: string;
  description: string | null;
  technician: string | null;
  maintenanceDate: string;
  cost: number | null;
  nextMaintenanceDate: string | null;
};

export type MoldInstallationJson = {
  id: string;
  machineId: string;
  machineCode: string | null;
  machineName: string | null;
  machineType: string | null;
  installedAt: string;
  removedAt: string | null;
  installedBy: string | null;
  notes: string | null;
};

export type MoldJson = {
  id: string;
  moldCode: string;
  moldName: string;
  moldType: MoldType;
  status: MoldStatus;
  productId: string | null;
  productName: string | null;
  cavityCount: number;
  materialType: string | null;
  machineId: string | null;
  machineCode: string | null;
  machineName: string | null;
  manufacturer: string | null;
  manufacturingCountry: string | null;
  manufacturingDate: string | null;
  purchaseDate: string | null;
  purchaseCost: number | null;
  moldWeight: number | null;
  moldDimensions: string | null;
  expectedLifeCycles: number | null;
  totalCycles: number;
  currentLocation: string | null;
  maintenanceCycle: number | null;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  imageUrl: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type MoldDetailJson = MoldJson & {
  spec: InjectionMoldSpecJson | PetBlowMoldSpecJson | CompressionMoldSpecJson | PolyethyleneMoldSpecJson | null;
  images: MoldImageJson[];
  maintenanceLogs: MoldMaintenanceLogJson[];
  installations: MoldInstallationJson[];
  activeInstallation: MoldInstallationJson | null;
};

export type MoldPayload = {
  productId: string;
  moldCode: string;
  moldName: string;
  moldType: MoldType;
  status?: MoldStatus;
  cavityCount?: number;
  productName?: string;
  materialType?: string;
  machineId?: string | null;
  manufacturer?: string;
  manufacturingCountry?: string;
  manufacturingDate?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  moldWeight?: number;
  moldDimensions?: string;
  expectedLifeCycles?: number;
  totalCycles?: number;
  currentLocation?: string;
  maintenanceCycle?: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  notes?: string;
  isActive?: boolean;
  spec?: Record<string, unknown>;
};

type ListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  moldType?: MoldType;
  status?: MoldStatus;
  isActive?: boolean | "all";
  sort?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { ...authFetchHeaders() };
  const isForm = init?.body instanceof FormData;
  if (!isForm) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${getLaravelApiBaseUrl()}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
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
    throw new MoldsApiError(res.status, msg);
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

export const moldsApi = {
  listProducts() {
    return request<{ data: ProductJson[] }>("/products?pageSize=100");
  },

  list(params?: ListParams) {
    const isActive =
      params?.isActive === undefined || params.isActive === "all"
        ? undefined
        : params.isActive
          ? "1"
          : "0";
    return request<{ data: MoldJson[]; meta: MoldListMeta }>(
      `/molds${buildQuery({
        page: params?.page,
        pageSize: params?.pageSize,
        search: params?.search,
        mold_type: params?.moldType,
        status: params?.status,
        isActive,
        sort: params?.sort
      })}`
    );
  },

  listByType(type: MoldType, params?: Omit<ListParams, "moldType">) {
    const isActive =
      params?.isActive === undefined || params.isActive === "all"
        ? undefined
        : params.isActive
          ? "1"
          : "0";
    return request<{ data: MoldJson[]; meta: MoldListMeta }>(
      `/molds/by-type/${type}${buildQuery({
        page: params?.page,
        pageSize: params?.pageSize,
        search: params?.search,
        status: params?.status,
        isActive,
        sort: params?.sort
      })}`
    );
  },

  show(id: string) {
    return request<{ data: MoldDetailJson }>(`/molds/${id}`);
  },

  create(payload: MoldPayload) {
    return request<{ data: MoldDetailJson }>("/molds", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  update(id: string, payload: Partial<MoldPayload>) {
    return request<{ data: MoldDetailJson }>(`/molds/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  },

  remove(id: string) {
    return request<{ deleted: boolean }>(`/molds/${id}`, { method: "DELETE" });
  },

  uploadImage(moldId: string, file: File, opts?: { imageType?: string; isPrimary?: boolean }) {
    const form = new FormData();
    form.append("image", file);
    if (opts?.imageType) form.append("imageType", opts.imageType);
    if (opts?.isPrimary) form.append("isPrimary", "1");

    return request<{ data: MoldImageJson }>(`/molds/${moldId}/images`, {
      method: "POST",
      body: form
    });
  },

  deleteImage(imageId: string) {
    return request<{ deleted: boolean }>(`/mold-images/${imageId}`, { method: "DELETE" });
  },

  setPrimaryImage(imageId: string) {
    return request<{ data: MoldImageJson }>(`/mold-images/${imageId}/primary`, { method: "PATCH" });
  },

  addMaintenance(
    moldId: string,
    payload: {
      maintenanceType: string;
      description?: string;
      technician?: string;
      maintenanceDate: string;
      cost?: number;
      nextMaintenanceDate?: string;
    }
  ) {
    return request<{ data: MoldMaintenanceLogJson }>(`/molds/${moldId}/maintenance`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  stats() {
    return request<{ data: MoldStatsJson }>("/molds/stats");
  }
};

export type MoldStatsJson = {
  total: number;
  byType: Record<MoldType, number>;
  byStatus: Record<MoldStatus, number>;
  maintenanceDue: number;
  maintenanceLogsLast30Days: number;
  polyethylene: {
    byMaterial: Record<PolyethyleneType, number>;
    byProductionMethod: Record<PeProductionMethod, number>;
  };
  imagesByType: Record<MoldImageType, number>;
};

export const MOLD_IMAGE_TYPES: { value: MoldImageType; label: string }[] = [
  { value: "photo", label: "صورة عامة" },
  { value: "technical_drawing", label: "رسم فني" },
  { value: "exploded_diagram", label: "مخطط تفكيك" },
  { value: "maintenance_photo", label: "صورة صيانة" }
];

/** Machine type codes compatible with each mold category */
export const MOLD_MACHINE_COMPAT: Record<MoldType, string[]> = {
  injection: ["injection"],
  pet_blow: ["blow", "blow_molding"],
  compression: ["compression"],
  polyethylene: ["pe_production", "pe_rotational", "pe_blow", "pe_extrusion"]
};
