import { z } from "zod";

const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().optional()
);

export const injectionSpecSchema = z.object({
  clampingForceTon: optionalNumber,
  shotWeightGram: optionalNumber,
  screwDiameterMm: optionalNumber,
  injectionPressureBar: optionalNumber,
  heatingZonesCount: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().optional()
  ),
  maxCycleTimeSec: optionalNumber
});

export const blowSpecSchema = z.object({
  bottleVolumeMinMl: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().optional()
  ),
  bottleVolumeMaxMl: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().optional()
  ),
  cavitiesCount: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().optional()
  ),
  airPressureBar: optionalNumber,
  productionCapacityBph: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().optional()
  )
});

export const machineFormSchema = z.object({
  machineTypeId: z.string().min(1, "اختر نوع الماكينة"),
  code: z.string().min(1, "الرمز مطلوب").max(40),
  name: z.string().min(1, "الاسم مطلوب").max(120),
  brand: z.string().max(80).optional().or(z.literal("")),
  model: z.string().max(80).optional().or(z.literal("")),
  serialNumber: z.string().max(80).optional().or(z.literal("")),
  factorySection: z.string().max(120).optional().or(z.literal("")),
  productionLine: z.string().max(120).optional().or(z.literal("")),
  powerKw: optionalNumber,
  hourlyEnergyConsumption: optionalNumber,
  installationDate: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  status: z.enum(["running", "stopped", "maintenance", "breakdown"]).default("stopped"),
  injectionSpec: injectionSpecSchema.optional(),
  blowSpec: blowSpecSchema.optional()
});

export type MachineFormValues = z.infer<typeof machineFormSchema>;

export const emptyMachineForm = (): MachineFormValues => ({
  machineTypeId: "",
  code: "",
  name: "",
  brand: "",
  model: "",
  serialNumber: "",
  factorySection: "",
  productionLine: "",
  powerKw: undefined,
  hourlyEnergyConsumption: undefined,
  installationDate: "",
  notes: "",
  isActive: true,
  status: "stopped",
  injectionSpec: {},
  blowSpec: {}
});
