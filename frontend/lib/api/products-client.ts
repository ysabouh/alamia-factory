import { getLaravelApiBaseUrl } from "@/lib/api/resolve-api-base";
import { authFetchHeaders } from "@/lib/auth/factory-auth-api";

export class ProductsApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ProductsApiError";
  }
}

export type ProductType =
  | "finished_good"
  | "semi_finished"
  | "raw_material"
  | "packaging"
  | "regrind"
  | "spare_part";

export type ManufacturingType = "injection" | "pet_blow" | "compression" | "polyethylene";

export type ManufacturingMode = "manufactured" | "assembled" | "hybrid" | "purchased";

export type ProductStatus = "active" | "inactive" | "development";

export type ProductImageType = "main" | "technical" | "packaging" | "marketing" | "drawing";

export type ProductDocumentType = "pdf" | "drawing" | "datasheet" | "qc_sheet" | "setup_sheet" | "other";

export type ProductListMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ProductMastersJson = {
  categories: Array<{
    id: string;
    categoryCode: string;
    categoryNameAr: string;
    categoryNameEn: string | null;
    parentId: string | null;
  }>;
  materials: Array<{ id: string; materialCode: string; materialName: string }>;
  colors: Array<{ id: string; colorCode: string; colorName: string; hexColor: string | null }>;
  units: Array<{ id: string; unitCode: string; unitNameAr: string; symbol: string | null }>;
};

import type { ProductOperationJson } from "@/lib/api/routing-client";

export type ProductQualitySpecJson = {
  weightTolerance: number | null;
  thicknessTolerance: number | null;
  colorTolerance: number | null;
  pressureTestRequired: boolean;
  leakTestRequired: boolean;
  dropTestRequired: boolean;
  visualInspectionRequired: boolean;
  qcNotes: string | null;
};

export type ProductBomLineJson = {
  id?: string;
  materialProductId: string;
  materialProductCode?: string | null;
  materialProductName?: string | null;
  childProductCode?: string | null;
  childProductName?: string | null;
  componentType?: string;
  quantity: number;
  unitId?: string | null;
  unitName?: string | null;
  wastePercentage?: number;
  notes?: string | null;
};

export type ProductMoldLinkJson = {
  id?: string;
  moldId: string;
  moldCode?: string | null;
  moldName?: string | null;
  priority?: number;
  isDefault?: boolean;
  notes?: string | null;
};

export type ProductMachineSettingJson = {
  id?: string;
  machineId: string;
  machineCode?: string | null;
  machineName?: string | null;
  cycleTime?: number | null;
  injectionPressure?: number | null;
  holdingPressure?: number | null;
  coolingTime?: number | null;
  moldTemperature?: number | null;
  barrelTemperatureProfile?: number[] | null;
  shotWeight?: number | null;
  clampForce?: number | null;
  backPressure?: number | null;
  screwSpeed?: number | null;
  setupNotes?: string | null;
};

export type ProductImageJson = {
  id: string;
  imageUrl: string;
  imageType: ProductImageType;
  isPrimary: boolean;
  uploadedAt: string | null;
};

export type ProductDocumentJson = {
  id: string;
  documentName: string;
  documentType: ProductDocumentType;
  fileUrl: string;
  uploadedAt: string | null;
};

export type ProductJson = {
  id: string;
  productCode: string;
  sku: string | null;
  barcode: string | null;
  productNameAr: string;
  productNameEn: string | null;
  shortName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  productType: ProductType;
  manufacturingMode?: ManufacturingMode;
  manufacturingType: ManufacturingType | null;
  plasticMaterialId: string | null;
  plasticMaterialName: string | null;
  colorId: string | null;
  colorName: string | null;
  unitId: string | null;
  unitName: string | null;
  productWeight: number | null;
  productVolume: number | null;
  dimensions: string | null;
  cavityOutput: number | null;
  standardCycleTime: number | null;
  targetOutputPerHour: number | null;
  productStatus: ProductStatus;
  imageUrl: string | null;
  technicalNotes: string | null;
  isActive: boolean;
  standardWeightGrams: number | null;
  code: string;
  name: string;
  unit: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ProductDetailJson = ProductJson & {
  qualitySpec: ProductQualitySpecJson | null;
  bom: ProductBomLineJson[];
  molds: ProductMoldLinkJson[];
  machineSettings: ProductMachineSettingJson[];
  operations?: ProductOperationJson[];
  assignedMachines?: Array<{
    machineId: string;
    machineCode?: string | null;
    machineName?: string | null;
    operationIds: string[];
  }>;
  assignedMolds?: Array<{
    moldId: string;
    moldCode?: string | null;
    moldName?: string | null;
    operationIds: string[];
  }>;
  images: ProductImageJson[];
  documents: ProductDocumentJson[];
};

export type ProductPayload = {
  productCode: string;
  sku?: string;
  barcode?: string;
  productNameAr: string;
  productNameEn?: string;
  shortName?: string;
  categoryId?: string;
  productType?: ProductType;
  manufacturingMode?: ManufacturingMode;
  manufacturingType?: ManufacturingType;
  plasticMaterialId?: string;
  colorId?: string;
  unitId?: string;
  productWeight?: number;
  productVolume?: number;
  dimensions?: string;
  cavityOutput?: number;
  standardCycleTime?: number;
  targetOutputPerHour?: number;
  productStatus?: ProductStatus;
  technicalNotes?: string;
  isActive?: boolean;
  standardWeightGrams?: number;
  qualitySpec?: Partial<ProductQualitySpecJson>;
  bom?: ProductBomLineJson[];
  molds?: ProductMoldLinkJson[];
  machineSettings?: ProductMachineSettingJson[];
};

type ListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  productType?: ProductType | "all";
  manufacturingType?: ManufacturingType | "all";
  productStatus?: ProductStatus | "all";
  isActive?: boolean | "all";
  categoryId?: string;
};

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

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
    throw new ProductsApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const productsApi = {
  masters() {
    return request<{ data: ProductMastersJson }>("/products/masters");
  },

  list(params?: ListParams) {
    return request<{ data: ProductJson[]; meta: ProductListMeta }>(
      `/products${buildQuery({
        page: params?.page,
        pageSize: params?.pageSize,
        search: params?.search,
        productType: params?.productType === "all" ? undefined : params?.productType,
        manufacturingType: params?.manufacturingType === "all" ? undefined : params?.manufacturingType,
        productStatus: params?.productStatus === "all" ? undefined : params?.productStatus,
        isActive:
          params?.isActive === undefined || params?.isActive === "all"
            ? undefined
            : params.isActive
              ? "1"
              : "0",
        categoryId: params?.categoryId
      })}`
    );
  },

  show(id: string) {
    return request<{ data: ProductDetailJson }>(`/products/${id}`);
  },

  create(payload: ProductPayload) {
    return request<{ data: ProductDetailJson }>("/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  update(id: string, payload: ProductPayload) {
    return request<{ data: ProductDetailJson }>(`/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  remove(id: string) {
    return request<void>(`/products/${id}`, { method: "DELETE" });
  },

  bom(id: string) {
    return request<{ data: ProductBomLineJson[] }>(`/products/${id}/bom`);
  },

  molds(id: string) {
    return request<{ data: ProductMoldLinkJson[] }>(`/products/${id}/molds`);
  },

  machineSettings(id: string) {
    return request<{ data: ProductMachineSettingJson[] }>(`/products/${id}/machine-settings`);
  },

  uploadImage(productId: string, file: File, imageType?: ProductImageType, isPrimary?: boolean) {
    const fd = new FormData();
    fd.append("image", file);
    if (imageType) fd.append("imageType", imageType);
    if (isPrimary) fd.append("isPrimary", "1");
    return request<{ data: ProductImageJson }>(`/products/${productId}/images`, {
      method: "POST",
      body: fd
    });
  },

  uploadDocument(productId: string, file: File, documentName: string, documentType?: ProductDocumentType) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("documentName", documentName);
    if (documentType) fd.append("documentType", documentType);
    return request<{ data: ProductDocumentJson }>(`/products/${productId}/documents`, {
      method: "POST",
      body: fd
    });
  },

  deleteImage(imageId: string) {
    return request<{ deleted: boolean }>(`/product-images/${imageId}`, { method: "DELETE" });
  },

  setPrimaryImage(imageId: string) {
    return request<{ data: ProductImageJson }>(`/product-images/${imageId}/primary`, { method: "PATCH" });
  },

  deleteDocument(documentId: string) {
    return request<{ deleted: boolean }>(`/product-documents/${documentId}`, { method: "DELETE" });
  }
};
