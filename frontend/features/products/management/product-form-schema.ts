import { z } from "zod";

import type {
  ManufacturingMode,
  ProductDetailJson,
  ProductPayload,
  ProductQualitySpecJson
} from "@/lib/api/products-client";

const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().optional()
);

const optionalPositiveInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().int().min(1, "يجب أن يكون 1 على الأقل إن وُجد").optional()
);

const optionalNonNegativeInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().int().min(0).optional()
);

const qualitySpecSchema = z.object({
  weightTolerance: optionalNumber,
  thicknessTolerance: optionalNumber,
  colorTolerance: optionalNumber,
  pressureTestRequired: z.boolean().optional(),
  leakTestRequired: z.boolean().optional(),
  dropTestRequired: z.boolean().optional(),
  visualInspectionRequired: z.boolean().optional(),
  qcNotes: z.string().optional().or(z.literal(""))
});

const bomLineSchema = z.object({
  materialProductId: z.string().min(1, "اختر المادة"),
  quantity: z.coerce.number().min(0.0001, "الكمية مطلوبة"),
  unitId: z.string().optional().or(z.literal("")),
  wastePercentage: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal(""))
});

const moldLinkSchema = z.object({
  moldId: z.string().min(1, "اختر القالب"),
  priority: z.coerce.number().min(1).max(99).optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
  notes: z.string().optional().or(z.literal(""))
});

const machineSettingSchema = z.object({
  machineId: z.string().min(1, "اختر الماكينة"),
  cycleTime: optionalNumber,
  injectionPressure: optionalNumber,
  holdingPressure: optionalNumber,
  coolingTime: optionalNumber,
  moldTemperature: optionalNumber,
  shotWeight: optionalNumber,
  clampForce: optionalNumber,
  backPressure: optionalNumber,
  screwSpeed: optionalNumber,
  setupNotes: z.string().optional().or(z.literal(""))
});

export const productFormSchema = z.object({
  productCode: z.string().min(1, "رمز المنتج مطلوب").max(64),
  sku: z.string().max(64).optional().or(z.literal("")),
  barcode: z.string().max(128).optional().or(z.literal("")),
  productNameAr: z.string().min(1, "اسم المنتج مطلوب").max(255),
  productNameEn: z.string().max(255).optional().or(z.literal("")),
  shortName: z.string().max(120).optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  productType: z.enum([
    "finished_good",
    "semi_finished",
    "raw_material",
    "packaging",
    "regrind",
    "spare_part"
  ]),
  manufacturingMode: z
    .enum(["manufactured", "assembled", "hybrid", "purchased"])
    .default("manufactured"),
  manufacturingType: z
    .enum(["injection", "pet_blow", "compression", "polyethylene"])
    .optional()
    .or(z.literal("")),
  plasticMaterialId: z.string().optional().or(z.literal("")),
  colorId: z.string().optional().or(z.literal("")),
  unitId: z.string().optional().or(z.literal("")),
  productWeight: optionalNumber,
  productVolume: optionalNumber,
  dimensions: z.string().max(120).optional().or(z.literal("")),
  cavityOutput: optionalPositiveInt,
  standardCycleTime: optionalNonNegativeInt,
  targetOutputPerHour: optionalNonNegativeInt,
  productStatus: z.enum(["active", "inactive", "development"]),
  standardWeightGrams: optionalNumber,
  technicalNotes: z.string().optional().or(z.literal("")),
  isActive: z.boolean(),
  qualitySpec: qualitySpecSchema,
  bom: z.array(bomLineSchema),
  molds: z.array(moldLinkSchema),
  machineSettings: z.array(machineSettingSchema)
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export function emptyProductForm(): ProductFormValues {
  return {
    productCode: "",
    sku: "",
    barcode: "",
    productNameAr: "",
    productNameEn: "",
    shortName: "",
    categoryId: "",
    productType: "finished_good",
    manufacturingMode: "manufactured",
    manufacturingType: "",
    plasticMaterialId: "",
    colorId: "",
    unitId: "",
    productWeight: undefined,
    productVolume: undefined,
    dimensions: "",
    cavityOutput: undefined,
    standardCycleTime: undefined,
    targetOutputPerHour: undefined,
    productStatus: "active",
    standardWeightGrams: undefined,
    technicalNotes: "",
    isActive: true,
    qualitySpec: {
      weightTolerance: undefined,
      thicknessTolerance: undefined,
      colorTolerance: undefined,
      pressureTestRequired: false,
      leakTestRequired: false,
      dropTestRequired: false,
      visualInspectionRequired: true,
      qcNotes: ""
    },
    bom: [],
    molds: [],
    machineSettings: []
  };
}

function numOrUndef(v: unknown): number | undefined {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** يُحوّل القيم الفارغة أو 0 إلى undefined للحقول الاختيارية */
function optionalIntOrUndef(v: unknown): number | undefined {
  const n = numOrUndef(v);
  return n === undefined || n === 0 ? undefined : n;
}

export function formValuesToPayload(values: ProductFormValues): ProductPayload {
  const qs = values.qualitySpec;
  const qualitySpec: Partial<ProductQualitySpecJson> = {
    weightTolerance: numOrUndef(qs.weightTolerance) ?? null,
    thicknessTolerance: numOrUndef(qs.thicknessTolerance) ?? null,
    colorTolerance: numOrUndef(qs.colorTolerance) ?? null,
    pressureTestRequired: qs.pressureTestRequired ?? false,
    leakTestRequired: qs.leakTestRequired ?? false,
    dropTestRequired: qs.dropTestRequired ?? false,
    visualInspectionRequired: qs.visualInspectionRequired ?? true,
    qcNotes: qs.qcNotes || null
  };

  return {
    productCode: values.productCode,
    sku: values.sku || values.productCode,
    barcode: values.barcode || undefined,
    productNameAr: values.productNameAr,
    productNameEn: values.productNameEn || undefined,
    shortName: values.shortName || undefined,
    categoryId: values.categoryId || undefined,
    productType: values.productType,
    manufacturingMode: values.manufacturingMode as ManufacturingMode,
    manufacturingType: values.manufacturingType || undefined,
    plasticMaterialId: values.plasticMaterialId || undefined,
    colorId: values.colorId || undefined,
    unitId: values.unitId || undefined,
    productWeight: numOrUndef(values.productWeight),
    productVolume: numOrUndef(values.productVolume),
    dimensions: values.dimensions || undefined,
    cavityOutput: optionalIntOrUndef(values.cavityOutput),
    standardCycleTime: optionalIntOrUndef(values.standardCycleTime),
    targetOutputPerHour: optionalIntOrUndef(values.targetOutputPerHour),
    productStatus: values.productStatus,
    standardWeightGrams: numOrUndef(values.standardWeightGrams),
    technicalNotes: values.technicalNotes || undefined,
    isActive: values.isActive,
    qualitySpec,
    bom: values.bom.map((b) => ({
      materialProductId: b.materialProductId,
      quantity: Number(b.quantity),
      unitId: b.unitId || undefined,
      wastePercentage: numOrUndef(b.wastePercentage),
      notes: b.notes || undefined
    })),
    molds: values.molds.map((m) => ({
      moldId: m.moldId,
      priority: numOrUndef(m.priority) ?? 1,
      isDefault: m.isDefault ?? false,
      notes: m.notes || undefined
    })),
    machineSettings: values.machineSettings.map((s) => ({
      machineId: s.machineId,
      cycleTime: numOrUndef(s.cycleTime),
      injectionPressure: numOrUndef(s.injectionPressure),
      holdingPressure: numOrUndef(s.holdingPressure),
      coolingTime: numOrUndef(s.coolingTime),
      moldTemperature: numOrUndef(s.moldTemperature),
      shotWeight: numOrUndef(s.shotWeight),
      clampForce: numOrUndef(s.clampForce),
      backPressure: numOrUndef(s.backPressure),
      screwSpeed: numOrUndef(s.screwSpeed),
      setupNotes: s.setupNotes || undefined
    }))
  };
}

export function detailToFormValues(detail: ProductDetailJson): ProductFormValues {
  const qs = detail.qualitySpec;
  return {
    productCode: detail.productCode,
    sku: detail.sku ?? "",
    barcode: detail.barcode ?? "",
    productNameAr: detail.productNameAr,
    productNameEn: detail.productNameEn ?? "",
    shortName: detail.shortName ?? "",
    categoryId: detail.categoryId ?? "",
    productType: detail.productType,
    manufacturingMode: detail.manufacturingMode ?? "manufactured",
    manufacturingType: detail.manufacturingType ?? "",
    plasticMaterialId: detail.plasticMaterialId ?? "",
    colorId: detail.colorId ?? "",
    unitId: detail.unitId ?? "",
    productWeight: numOrUndef(detail.productWeight),
    productVolume: numOrUndef(detail.productVolume),
    dimensions: detail.dimensions ?? "",
    cavityOutput: optionalIntOrUndef(detail.cavityOutput),
    standardCycleTime: optionalIntOrUndef(detail.standardCycleTime),
    targetOutputPerHour: optionalIntOrUndef(detail.targetOutputPerHour),
    productStatus: detail.productStatus,
    standardWeightGrams: numOrUndef(detail.standardWeightGrams),
    technicalNotes: detail.technicalNotes ?? "",
    isActive: detail.isActive,
    qualitySpec: {
      weightTolerance: numOrUndef(qs?.weightTolerance),
      thicknessTolerance: numOrUndef(qs?.thicknessTolerance),
      colorTolerance: numOrUndef(qs?.colorTolerance),
      pressureTestRequired: qs?.pressureTestRequired ?? false,
      leakTestRequired: qs?.leakTestRequired ?? false,
      dropTestRequired: qs?.dropTestRequired ?? false,
      visualInspectionRequired: qs?.visualInspectionRequired ?? true,
      qcNotes: qs?.qcNotes ?? ""
    },
    bom: (detail.bom ?? []).map((b) => ({
      materialProductId: b.materialProductId,
      quantity: b.quantity,
      unitId: b.unitId ?? "",
      wastePercentage: b.wastePercentage ?? "",
      notes: b.notes ?? ""
    })),
    molds: (detail.molds ?? []).map((m) => ({
      moldId: m.moldId,
      priority: m.priority ?? 1,
      isDefault: m.isDefault ?? false,
      notes: m.notes ?? ""
    })),
    machineSettings: (detail.machineSettings ?? []).map((s) => ({
      machineId: s.machineId,
      cycleTime: numOrUndef(s.cycleTime),
      injectionPressure: numOrUndef(s.injectionPressure),
      holdingPressure: numOrUndef(s.holdingPressure),
      coolingTime: numOrUndef(s.coolingTime),
      moldTemperature: numOrUndef(s.moldTemperature),
      shotWeight: numOrUndef(s.shotWeight),
      clampForce: numOrUndef(s.clampForce),
      backPressure: numOrUndef(s.backPressure),
      screwSpeed: numOrUndef(s.screwSpeed),
      setupNotes: s.setupNotes ?? ""
    }))
  };
}
