import { z } from "zod";

const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().optional()
);

const optionalInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().int().optional()
);

export const injectionMoldSpecSchema = z.object({
  hotRunner: z.boolean().optional(),
  runnerType: z.string().optional().or(z.literal("")),
  gateType: z.string().optional().or(z.literal("")),
  coolingCircuitCount: optionalInt,
  ejectorSystemType: z.string().optional().or(z.literal("")),
  maxInjectionPressure: optionalNumber,
  clampForceRequired: optionalNumber,
  cycleTime: optionalNumber,
  moldSteelType: z.string().optional().or(z.literal("")),
  shrinkageRate: optionalNumber,
  corePullCount: optionalInt,
  textureType: z.string().optional().or(z.literal("")),
  supportedMaterials: z.string().optional().or(z.literal(""))
});

export const petBlowMoldSpecSchema = z.object({
  blowType: z.enum(["extrusion", "injection", "stretch"]).optional().or(z.literal("")),
  bottleVolumeMl: optionalInt,
  neckDiameter: optionalNumber,
  coolingMethod: z.string().optional().or(z.literal("")),
  airPressureRequired: optionalNumber,
  blowRatio: optionalNumber,
  parisonType: z.string().optional().or(z.literal("")),
  coolingTime: optionalNumber,
  moldMaterial: z.string().optional().or(z.literal("")),
  supportedPolymers: z.string().optional().or(z.literal("")),
  maxTemperature: optionalNumber
});

export const compressionMoldSpecSchema = z.object({
  compressionForce: optionalNumber,
  heatingType: z.string().optional().or(z.literal("")),
  moldTemperature: optionalNumber,
  pressureTime: optionalNumber,
  curingTime: optionalNumber,
  moldMaterial: z.string().optional().or(z.literal("")),
  heatingZones: optionalInt,
  supportedMaterials: z.string().optional().or(z.literal("")),
  maxProductThickness: optionalNumber
});

export const polyethyleneMoldSpecSchema = z.object({
  polyethyleneType: z.enum(["hdpe", "ldpe", "lldpe"]).optional().or(z.literal("")),
  productionMethod: z.enum(["blow", "rotational", "extrusion"]).optional().or(z.literal("")),
  tankVolume: optionalNumber,
  wallThickness: optionalNumber,
  coolingMethod: z.string().optional().or(z.literal("")),
  moldMaterial: z.string().optional().or(z.literal("")),
  heatingSystem: z.string().optional().or(z.literal("")),
  cycleTime: optionalNumber,
  pressureRating: optionalNumber,
  supportedProducts: z.string().optional().or(z.literal("")),
  maxTemperature: optionalNumber,
  minTemperature: optionalNumber,
  moldLayers: optionalInt,
  rotationalSpeed: optionalNumber,
  shrinkageRate: optionalNumber
});

export const moldFormSchema = z.object({
  productId: z.string().min(1, "اختر المنتج"),
  moldCode: z.string().min(1, "رمز القالب مطلوب").max(40),
  moldName: z.string().min(1, "اسم القالب مطلوب").max(120),
  moldType: z.enum(["injection", "pet_blow", "compression", "polyethylene"]),
  status: z.enum(["active", "maintenance", "inactive"]).default("active"),
  cavityCount: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? 1 : Number(v)),
    z.number().int().min(1)
  ),
  productName: z.string().max(120).optional().or(z.literal("")),
  materialType: z.string().max(80).optional().or(z.literal("")),
  machineId: z.string().optional().or(z.literal("")),
  manufacturer: z.string().max(120).optional().or(z.literal("")),
  manufacturingCountry: z.string().max(80).optional().or(z.literal("")),
  manufacturingDate: z.string().optional().or(z.literal("")),
  purchaseDate: z.string().optional().or(z.literal("")),
  purchaseCost: optionalNumber,
  moldWeight: optionalNumber,
  moldDimensions: z.string().max(120).optional().or(z.literal("")),
  expectedLifeCycles: optionalInt,
  totalCycles: optionalInt,
  currentLocation: z.string().max(120).optional().or(z.literal("")),
  maintenanceCycle: optionalInt,
  lastMaintenanceDate: z.string().optional().or(z.literal("")),
  nextMaintenanceDate: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  injectionSpec: injectionMoldSpecSchema.optional(),
  petBlowSpec: petBlowMoldSpecSchema.optional(),
  compressionSpec: compressionMoldSpecSchema.optional(),
  polyethyleneSpec: polyethyleneMoldSpecSchema.optional()
});

export type MoldFormValues = z.infer<typeof moldFormSchema>;

export const emptyMoldForm = (): MoldFormValues => ({
  productId: "",
  moldCode: "",
  moldName: "",
  moldType: "injection",
  status: "active",
  cavityCount: 1,
  productName: "",
  materialType: "",
  machineId: "",
  manufacturer: "",
  manufacturingCountry: "",
  manufacturingDate: "",
  purchaseDate: "",
  purchaseCost: undefined,
  moldWeight: undefined,
  moldDimensions: "",
  expectedLifeCycles: undefined,
  totalCycles: undefined,
  currentLocation: "",
  maintenanceCycle: undefined,
  lastMaintenanceDate: "",
  nextMaintenanceDate: "",
  notes: "",
  isActive: true,
  injectionSpec: {},
  petBlowSpec: {},
  compressionSpec: {},
  polyethyleneSpec: {}
});

function csvToArray(value?: string): string[] | undefined {
  if (!value?.trim()) return undefined;
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export function formValuesToPayload(values: MoldFormValues) {
  let spec: Record<string, unknown> | undefined;
  if (values.moldType === "injection" && values.injectionSpec) {
    spec = {
      ...values.injectionSpec,
      hotRunner: values.injectionSpec.hotRunner ?? false,
      supportedMaterials: csvToArray(values.injectionSpec.supportedMaterials)
    };
  } else if (values.moldType === "pet_blow" && values.petBlowSpec) {
    spec = {
      ...values.petBlowSpec,
      blowType: values.petBlowSpec.blowType || undefined,
      supportedPolymers: csvToArray(values.petBlowSpec.supportedPolymers)
    };
  } else if (values.moldType === "compression" && values.compressionSpec) {
    spec = {
      ...values.compressionSpec,
      supportedMaterials: csvToArray(values.compressionSpec.supportedMaterials)
    };
  } else if (values.moldType === "polyethylene" && values.polyethyleneSpec) {
    spec = {
      ...values.polyethyleneSpec,
      polyethyleneType: values.polyethyleneSpec.polyethyleneType || undefined,
      productionMethod: values.polyethyleneSpec.productionMethod || undefined,
      supportedProducts: csvToArray(values.polyethyleneSpec.supportedProducts)
    };
  }

  return {
    productId: values.productId,
    moldCode: values.moldCode,
    moldName: values.moldName,
    moldType: values.moldType,
    status: values.status,
    cavityCount: values.cavityCount,
    productName: values.productName || undefined,
    materialType: values.materialType || undefined,
    machineId: values.machineId || null,
    manufacturer: values.manufacturer || undefined,
    manufacturingCountry: values.manufacturingCountry || undefined,
    manufacturingDate: values.manufacturingDate || undefined,
    purchaseDate: values.purchaseDate || undefined,
    purchaseCost: values.purchaseCost,
    moldWeight: values.moldWeight,
    moldDimensions: values.moldDimensions || undefined,
    expectedLifeCycles: values.expectedLifeCycles,
    totalCycles: values.totalCycles,
    currentLocation: values.currentLocation || undefined,
    maintenanceCycle: values.maintenanceCycle,
    lastMaintenanceDate: values.lastMaintenanceDate || undefined,
    nextMaintenanceDate: values.nextMaintenanceDate || undefined,
    notes: values.notes || undefined,
    isActive: values.isActive,
    spec
  };
}

function arrayToCsv(arr?: string[] | null): string {
  return arr?.join(", ") ?? "";
}

export function detailToFormValues(detail: import("@/lib/api/molds-client").MoldDetailJson): MoldFormValues {
  const spec = detail.spec ?? {};
  return {
    productId: detail.productId ?? "",
    moldCode: detail.moldCode,
    moldName: detail.moldName,
    moldType: detail.moldType,
    status: detail.status,
    cavityCount: detail.cavityCount,
    productName: detail.productName ?? "",
    materialType: detail.materialType ?? "",
    machineId: detail.machineId ?? "",
    manufacturer: detail.manufacturer ?? "",
    manufacturingCountry: detail.manufacturingCountry ?? "",
    manufacturingDate: detail.manufacturingDate ?? "",
    purchaseDate: detail.purchaseDate ?? "",
    purchaseCost: detail.purchaseCost ?? undefined,
    moldWeight: detail.moldWeight ?? undefined,
    moldDimensions: detail.moldDimensions ?? "",
    expectedLifeCycles: detail.expectedLifeCycles ?? undefined,
    totalCycles: detail.totalCycles,
    currentLocation: detail.currentLocation ?? "",
    maintenanceCycle: detail.maintenanceCycle ?? undefined,
    lastMaintenanceDate: detail.lastMaintenanceDate ?? "",
    nextMaintenanceDate: detail.nextMaintenanceDate ?? "",
    notes: detail.notes ?? "",
    isActive: detail.isActive,
    injectionSpec:
      detail.moldType === "injection"
        ? ({
            ...(spec as import("@/lib/api/molds-client").InjectionMoldSpecJson),
            supportedMaterials: arrayToCsv((spec as import("@/lib/api/molds-client").InjectionMoldSpecJson).supportedMaterials)
          } as MoldFormValues["injectionSpec"])
        : {},
    petBlowSpec:
      detail.moldType === "pet_blow"
        ? ({
            ...(spec as import("@/lib/api/molds-client").PetBlowMoldSpecJson),
            blowType: (spec as import("@/lib/api/molds-client").PetBlowMoldSpecJson).blowType ?? "",
            supportedPolymers: arrayToCsv((spec as import("@/lib/api/molds-client").PetBlowMoldSpecJson).supportedPolymers)
          } as MoldFormValues["petBlowSpec"])
        : {},
    compressionSpec:
      detail.moldType === "compression"
        ? ({
            ...(spec as import("@/lib/api/molds-client").CompressionMoldSpecJson),
            supportedMaterials: arrayToCsv((spec as import("@/lib/api/molds-client").CompressionMoldSpecJson).supportedMaterials)
          } as MoldFormValues["compressionSpec"])
        : {},
    polyethyleneSpec:
      detail.moldType === "polyethylene"
        ? ({
            ...(spec as import("@/lib/api/molds-client").PolyethyleneMoldSpecJson),
            polyethyleneType: (spec as import("@/lib/api/molds-client").PolyethyleneMoldSpecJson).polyethyleneType ?? "",
            productionMethod: (spec as import("@/lib/api/molds-client").PolyethyleneMoldSpecJson).productionMethod ?? "",
            supportedProducts: arrayToCsv((spec as import("@/lib/api/molds-client").PolyethyleneMoldSpecJson).supportedProducts)
          } as MoldFormValues["polyethyleneSpec"])
        : {}
  };
}
