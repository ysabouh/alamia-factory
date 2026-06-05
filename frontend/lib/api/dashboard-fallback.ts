import type { LiveDashboard } from "@/types/factory";

export const fallbackDashboard: LiveDashboard = {
  kpis: {
    producedPiecesToday: 18420,
    producedWeightKgToday: 912.4,
    wasteRate: 3.8,
    machineUtilization: 82,
    openMaintenanceTickets: 3,
    lowStockItems: 5
  },
  machines: [
    {
      id: 1,
      code: "INJ-01",
      name: "حقن 350 طن",
      type: "injection",
      status: "running",
      currentMold: "غطاء 5 لتر",
      operator: "محمد",
      technician: "أحمد",
      producedPiecesToday: 6200,
      producedWeightKgToday: 248,
      wasteKgToday: 7.4,
      downtimeMinutesToday: 12,
      activeAlert: null
    },
    {
      id: 2,
      code: "BLW-02",
      name: "نفخ عبوات",
      type: "blow",
      status: "stopped",
      currentMold: "عبوة 1 لتر",
      operator: "سامر",
      technician: "وليد",
      producedPiecesToday: 4100,
      producedWeightKgToday: 205,
      wasteKgToday: 11,
      downtimeMinutesToday: 45,
      activeAlert: "انتظار مواد خام"
    },
    {
      id: 3,
      code: "INJ-04",
      name: "حقن 180 طن",
      type: "injection",
      status: "maintenance",
      currentMold: "يد بلاستيك",
      operator: null,
      technician: "علي",
      producedPiecesToday: 2900,
      producedWeightKgToday: 116,
      wasteKgToday: 3.5,
      downtimeMinutesToday: 88,
      activeAlert: "صيانة هيدروليك"
    }
  ],
  productionTrend: [
    { label: "08:00", produced: 1800, waste: 45 },
    { label: "10:00", produced: 4200, waste: 120 },
    { label: "12:00", produced: 7600, waste: 210 },
    { label: "14:00", produced: 11800, waste: 330 },
    { label: "16:00", produced: 18420, waste: 690 }
  ],
  alerts: [
    {
      id: 1,
      severity: "warning",
      message: "مخزون PP منخفض في المستودع الرئيسي",
      createdAt: "2026-05-07T12:20:00Z"
    },
    {
      id: 2,
      severity: "critical",
      message: "توقف ماكينة INJ-04 بسبب عطل هيدروليك",
      createdAt: "2026-05-07T13:05:00Z"
    }
  ]
};
