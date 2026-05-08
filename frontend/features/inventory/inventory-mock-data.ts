export type MaterialCategory = "raw" | "finished" | "packaging" | "spare" | "mold" | "waste";

export interface MaterialItem {
  id: string;
  category: MaterialCategory;
  name: string;
  image: string;
  qty: number;
  unit: string;
  location: string;
  consumptionKgPerDay: number;
  remainingDays: number;
  supplier: string;
  unitCost: number;
  quality: "approved" | "hold" | "inspect";
}

export const categoryLabelAr: Record<MaterialCategory, string> = {
  raw: "مواد خام",
  finished: "منتج تام",
  packaging: "تغليف",
  spare: "قطع غيار",
  mold: "قوالب",
  waste: "هدر وتدوير"
};

export const mockMaterials: MaterialItem[] = [
  {
    id: "M-PP-01",
    category: "raw",
    name: "حبيبات PP طبيعي",
    image: "https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=400",
    qty: 12400,
    unit: "كغ",
    location: "A-12-3",
    consumptionKgPerDay: 890,
    remainingDays: 14,
    supplier: "بتروكيم",
    unitCost: 2.45,
    quality: "approved"
  },
  {
    id: "M-PE-08",
    category: "raw",
    name: "PE عالي الكثافة",
    image: "https://images.pexels.com/photos/802221/pexels-photo-802221.jpeg?auto=compress&w=400",
    qty: 8200,
    unit: "كغ",
    location: "B-04-1",
    consumptionKgPerDay: 420,
    remainingDays: 19,
    supplier: "سبكو",
    unitCost: 2.1,
    quality: "approved"
  },
  {
    id: "M-MB-02",
    category: "raw",
    name: "Masterbatch أزرق",
    image: "https://images.pexels.com/photos/1029243/pexels-photo-1029243.jpeg?auto=compress&w=400",
    qty: 340,
    unit: "كغ",
    location: "A-02-2",
    consumptionKgPerDay: 28,
    remainingDays: 8,
    supplier: "كلاريانت",
    unitCost: 14.2,
    quality: "inspect"
  },
  {
    id: "F-CAP-5L",
    category: "finished",
    name: "غطاء 5 لتر نهائي",
    image: "https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&w=400",
    qty: 48200,
    unit: "قطعة",
    location: "SHIP-01",
    consumptionKgPerDay: 0,
    remainingDays: 999,
    supplier: "إنتاج داخلي",
    unitCost: 0.12,
    quality: "approved"
  },
  {
    id: "P-CAR-20",
    category: "packaging",
    name: "كراتين تغليف 20 حبة",
    image: "https://images.pexels.com/photos/448974/pexels-photo-448974.jpeg?auto=compress&w=400",
    qty: 2100,
    unit: "صندوق",
    location: "P-08",
    consumptionKgPerDay: 95,
    remainingDays: 22,
    supplier: "كراتين الخليج",
    unitCost: 1.85,
    quality: "approved"
  },
  {
    id: "S-HYD-77",
    category: "spare",
    name: "خرطوم هيدروليك 3/8",
    image: "https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg?auto=compress&w=400",
    qty: 12,
    unit: "قطعة",
    location: "S-MAINT",
    consumptionKgPerDay: 0,
    remainingDays: 45,
    supplier: "قطع الصناعة",
    unitCost: 124,
    quality: "approved"
  }
];

export const turnoverData = [
  { m: "يناير", turn: 12.4, waste: 2.1 },
  { m: "فبراير", turn: 13.1, waste: 1.9 },
  { m: "مارس", turn: 11.8, waste: 2.4 },
  { m: "أبريل", turn: 14.2, waste: 1.7 },
  { m: "مايو", turn: 13.6, waste: 2.0 }
];

export const warehouseEffData = [
  { z: "أ", u: 78 },
  { z: "ب", u: 92 },
  { z: "ج", u: 64 },
  { z: "صيانة", u: 54 }
];
