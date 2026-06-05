import { z } from "zod";

import type { OperationType } from "@/lib/api/routing-client";

const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().optional()
);

export const operationMachineSettingSchema = z.object({
  machineId: z.string().min(1, "اختر الماكينة"),
  injectionPressure: optionalNumber,
  holdingPressure: optionalNumber,
  coolingTime: optionalNumber,
  moldTemperature: optionalNumber,
  barrelTemperatureProfile: z.array(z.number()).optional(),
  clampForce: optionalNumber,
  shotWeight: optionalNumber,
  screwSpeed: optionalNumber,
  backPressure: optionalNumber,
  setupNotes: z.string().optional().or(z.literal(""))
});

export const operationMaterialConsumptionSchema = z.object({
  materialProductId: z.string().min(1, "اختر المادة"),
  plannedQuantity: z.coerce.number().min(0).optional(),
  actualQuantity: optionalNumber,
  wasteQuantity: optionalNumber
});

export const operationQualitySpecSchema = z.object({
  inspectionType: z.string().min(1, "نوع الفحص مطلوب"),
  toleranceMin: optionalNumber,
  toleranceMax: optionalNumber,
  inspectionFrequency: z.string().optional().or(z.literal("")),
  qcNotes: z.string().optional().or(z.literal(""))
});

export const productOperationSchema = z.object({
  operationCode: z.string().min(1, "رمز العملية مطلوب").max(64),
  operationName: z.string().min(1, "اسم العملية مطلوب").max(255),
  operationType: z.enum([
    "injection",
    "blow",
    "compression",
    "assembly",
    "packaging",
    "labeling",
    "inspection",
    "cooling",
    "trimming",
    "printing"
  ] as [OperationType, ...OperationType[]]),
  sequenceOrder: z.coerce.number().int().min(1).optional(),
  machineId: z.string().optional().or(z.literal("")),
  moldId: z.string().optional().or(z.literal("")),
  workCenterId: z.string().optional().or(z.literal("")),
  setupTime: optionalNumber,
  cycleTime: optionalNumber,
  laborTime: optionalNumber,
  coolingTime: optionalNumber,
  operationInstructions: z.string().optional().or(z.literal("")),
  qcRequired: z.boolean().optional(),
  isActive: z.boolean().optional(),
  machineSettings: z.array(operationMachineSettingSchema).optional(),
  materialConsumptions: z.array(operationMaterialConsumptionSchema).optional(),
  qualitySpecs: z.array(operationQualitySpecSchema).optional()
});

export type ProductOperationFormValues = z.infer<typeof productOperationSchema>;

export function emptyOperationForm(): ProductOperationFormValues {
  return {
    operationCode: "",
    operationName: "",
    operationType: "injection",
    sequenceOrder: undefined,
    machineId: "",
    moldId: "",
    workCenterId: "",
    setupTime: undefined,
    cycleTime: undefined,
    laborTime: undefined,
    coolingTime: undefined,
    operationInstructions: "",
    qcRequired: false,
    isActive: true,
    machineSettings: [],
    materialConsumptions: [],
    qualitySpecs: []
  };
}
