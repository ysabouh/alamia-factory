import type { MoldStatus, MoldType } from "@/lib/api/molds-client";

export const moldTypeLabels: Record<MoldType, string> = {
  injection: "حقن",
  pet_blow: "نفخ PET",
  compression: "ضغط",
  polyethylene: "PE بولي"
};

export const moldTypeShortLabels: Record<MoldType, string> = {
  injection: "INJ",
  pet_blow: "PET",
  compression: "CMP",
  polyethylene: "PE"
};

export const moldStatusLabels: Record<MoldStatus, string> = {
  active: "نشط",
  maintenance: "صيانة",
  inactive: "غير نشط"
};

export function moldTypeBadgeVariant(type: MoldType): "default" | "secondary" | "outline" | "warning" {
  if (type === "injection") return "default";
  if (type === "pet_blow") return "secondary";
  if (type === "polyethylene") return "warning";
  return "outline";
}

export function moldStatusBadgeVariant(status: MoldStatus): "default" | "secondary" | "destructive" | "warning" {
  if (status === "active") return "default";
  if (status === "maintenance") return "warning";
  return "secondary";
}
