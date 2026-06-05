import type { ManufacturingType, ProductStatus, ProductType } from "@/lib/api/products-client";

export const productTypeLabels: Record<ProductType, string> = {
  finished_good: "منتج تام",
  semi_finished: "نصف مصنع",
  raw_material: "مادة خام",
  packaging: "تغليف",
  regrind: "إعادة تدوير",
  spare_part: "قطعة غيار"
};

export const manufacturingTypeLabels: Record<ManufacturingType, string> = {
  injection: "حقن",
  pet_blow: "نفخ PET",
  compression: "ضغط",
  polyethylene: "بولي إيثيلين"
};

export const productStatusLabels: Record<ProductStatus, string> = {
  active: "نشط",
  inactive: "غير نشط",
  development: "قيد التطوير"
};

export function productTypeBadgeVariant(type: ProductType): "default" | "secondary" | "outline" {
  if (type === "finished_good") return "default";
  if (type === "raw_material") return "outline";
  return "secondary";
}

export function manufacturingBadgeVariant(type: ManufacturingType): "default" | "secondary" | "outline" {
  return type === "injection" ? "default" : "secondary";
}

export const manufacturingModeLabels: Record<string, string> = {
  manufactured: "مصنّع",
  assembled: "مجمّع",
  hybrid: "هجين (تصنيع + تجميع)",
  purchased: "مشترى"
};

export function manufacturingModeBadgeVariant(
  mode: string
): "default" | "secondary" | "outline" {
  if (mode === "hybrid") return "default";
  if (mode === "assembled") return "secondary";
  if (mode === "purchased") return "outline";
  return "default";
}
