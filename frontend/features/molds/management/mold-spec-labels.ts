import type { MoldType } from "@/lib/api/molds-client";

/** Arabic labels for mold spec fields on detail views */
export const moldSpecFieldLabels: Record<string, string> = {
  hotRunner: "Hot Runner",
  runnerType: "نوع الـ Runner",
  gateType: "نوع البوابة",
  coolingCircuitCount: "دوائر التبريد",
  ejectorSystemType: "نظام الإخراج",
  maxInjectionPressure: "أقصى ضغط حقن (bar)",
  clampForceRequired: "قوة الإغلاق (ton)",
  cycleTime: "زمن الدورة (ث)",
  moldSteelType: "فولاذ القالب",
  shrinkageRate: "نسبة الانكماش",
  corePullCount: "Core Pulls",
  textureType: "نوع التexture",
  supportedMaterials: "مواد مدعومة",
  blowType: "نوع النفخ",
  bottleVolumeMl: "حجم الزجاجة (ml)",
  neckDiameter: "قطر العنق (mm)",
  coolingMethod: "طريقة التبريد",
  airPressureRequired: "ضغط الهواء (bar)",
  blowRatio: "Blow Ratio",
  parisonType: "نوع Parison",
  coolingTime: "زمن التبريد",
  moldMaterial: "مادة القالب",
  supportedPolymers: "بولimerات مدعومة",
  maxTemperature: "أقصى حرارة (°C)",
  minTemperature: "أدنى حرارة (°C)",
  compressionForce: "قوة الضغط",
  heatingType: "نوع التسخين",
  moldTemperature: "حرارة القالب",
  pressureTime: "زمن الضغط",
  curingTime: "زمن المعالجة",
  heatingZones: "مناطق التسخين",
  maxProductThickness: "أقصى سماكة منتج",
  polyethyleneType: "نوع PE",
  productionMethod: "طريقة الإنتاج",
  tankVolume: "حجم الخزان (L)",
  wallThickness: "سماكة الجدار (mm)",
  heatingSystem: "نظام التسخين",
  pressureRating: "تصنيف الضغط (bar)",
  supportedProducts: "منتجات مدعومة",
  moldLayers: "طبقات القالب",
  rotationalSpeed: "سرعة الدوران (rpm)"
};

export const polyethyleneTypeLabels: Record<string, string> = {
  hdpe: "HDPE",
  ldpe: "LDPE",
  lldpe: "LLDPE"
};

export const peProductionMethodLabels: Record<string, string> = {
  blow: "نفخ",
  rotational: "دوراني",
  extrusion: "بثق"
};

export function formatSpecValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "polyethyleneType") return polyethyleneTypeLabels[String(value)] ?? String(value);
  if (key === "productionMethod") return peProductionMethodLabels[String(value)] ?? String(value);
  if (key === "hotRunner") return value ? "نعم" : "لا";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export function specSectionTitle(moldType: MoldType): string {
  if (moldType === "polyethylene") return "مواصفات قالب Polyethylene (PE)";
  if (moldType === "injection") return "مواصفات قالب الحقن";
  if (moldType === "pet_blow") return "مواصفات قالب نفخ PET";
  if (moldType === "compression") return "مواصفات قالب الضغط";
  return "المواصفات الفنية";
}
