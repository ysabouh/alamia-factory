"use client";

import type React from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Cpu,
  Gauge,
  Hammer,
  Layers,
  LayoutDashboard,
  Package,
  PackageOpen,
  Recycle,
  ScanLine,
  Ship,
  Sparkles,
  Truck,
  Warehouse,
  Zap
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LiveDashboard, MachineSnapshot } from "@/types/factory";

import { ClassicWarehouseView } from "@/features/inventory/classic-warehouse-view";
import {
  mockMaterials,
  turnoverData,
  warehouseEffData,
  type MaterialCategory,
  type MaterialItem
} from "@/features/inventory/inventory-mock-data";

export type InventoryViewMode = "smart" | "classic";

type Props = { dashboard: LiveDashboard };

export function SmartInventoryCommandCenter({ dashboard }: Props) {
  const k = dashboard.kpis;
  const [viewMode, setViewMode] = useState<InventoryViewMode>("smart");
  const [filterCat, setFilterCat] = useState<MaterialCategory | "all">("all");

  const overview = useMemo(() => {
    const totalVal = mockMaterials.reduce((s, m) => s + m.qty * m.unitCost * (m.unit === "قطعة" ? 0.001 : 1), 0);
    const critical = mockMaterials.filter((m) => m.remainingDays < 10).length;
    const dailyUse = k.producedWeightKgToday * 0.85;
    const openPO = 6;
    const utilization = Math.min(98, 55 + k.machineUtilization / 2.8);
    return {
      totalVal: Math.round(totalVal / 1000),
      critical,
      dailyUse: Math.round(dailyUse),
      wastePct: k.wasteRate,
      openPO,
      utilization: Math.round(utilization)
    };
  }, [k]);

  const filteredMaterials = filterCat === "all" ? mockMaterials : mockMaterials.filter((m) => m.category === filterCat);

  const moldRows = useMemo(
    () =>
      dashboard.machines.slice(0, 5).map((m) => ({
        code: m.currentMold ?? "—",
        machine: m.code,
        health: m.status === "maintenance" ? 42 : m.activeAlert ? 68 : 88,
        lastUse: "اليوم",
        cycles: Math.round(m.producedPiecesToday * 14 + 12000),
        maint: m.status === "maintenance" ? "جارية" : m.activeAlert ? "مراجعة" : "طبيعي"
      })),
    [dashboard.machines]
  );

  return (
    <main className="factory-grid min-h-screen bg-background p-4 md:p-6">
      <div className="ds-page mx-auto max-w-[1920px] text-foreground" dir="rtl">
        <ViewModeSwitcher mode={viewMode} onChange={setViewMode} />

        {viewMode === "smart" ? (
          <>
            <InventoryHeader overview={overview} />

            <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
              <SmartWarehouseMap lowStockCount={k.lowStockItems} />
              <AlertsPanel dashboard={dashboard} />
            </section>

            <CategoryStrip active={filterCat} onSelect={setFilterCat} />

            <VisualCategoryCards active={filterCat} onSelect={setFilterCat} />

            <FlowVisualization />

            <section>
              <h2 className="ds-section-title mb-4 flex items-center gap-2">
                <Boxes className="h-5 w-5 text-cyan-400" />
                المواد الذكية
              </h2>
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {filteredMaterials.map((m, i) => (
                  <MaterialCard key={m.id} material={m} index={i} machines={dashboard.machines} />
                ))}
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <ProductionConnection dashboard={dashboard} />
              <MaintenanceSpares machines={dashboard.machines} />
            </section>

            <WasteRecyclingSection wasteRate={k.wasteRate} />
            <MoldStorageSection molds={moldRows} />
            <LiveStockStrip kpis={k} />

            <AnalyticsSection />
          </>
        ) : (
          <ClassicWarehouseView dashboard={dashboard} overview={overview} />
        )}
      </div>
    </main>
  );
}

function ViewModeSwitcher({ mode, onChange }: { mode: InventoryViewMode; onChange: (m: InventoryViewMode) => void }) {
  return (
    <div className="sticky top-0 z-20 mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs text-muted-foreground">وضع العمل</p>
        <p className="text-sm font-semibold">اختر المنظور المناسب: قيادة ذكية أو تشغيل يومي بالمستودع</p>
      </div>
      <div className="flex rounded-xl border border-border bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => onChange("smart")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            mode === "smart" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ScanLine className="h-4 w-4" />
          عرض صناعي ذكي
        </button>
        <button
          type="button"
          onClick={() => onChange("classic")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            mode === "classic" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          مخزن تشغيلي (كلاسيكي)
        </button>
      </div>
    </div>
  );
}

function InventoryHeader({
  overview
}: {
  overview: {
    totalVal: number;
    critical: number;
    dailyUse: number;
    wastePct: number;
    openPO: number;
    utilization: number;
  };
}) {
  const items = [
    { label: "قيمة المخزون (تقدير)", value: `${overview.totalVal}K $`, tone: "text-cyan-300" },
    { label: "تنبيهات حرجة", value: overview.critical.toString(), tone: "text-amber-400" },
    { label: "استهلاك يومي (كغ تقريبي)", value: overview.dailyUse.toLocaleString("ar"), tone: "text-emerald-300" },
    { label: "نسبة الهدر", value: `${overview.wastePct}%`, tone: "text-orange-300" },
    { label: "طلبات شراء مفتوحة", value: overview.openPO.toString(), tone: "text-violet-300" },
    { label: "استخدام المستودعات", value: `${overview.utilization}%`, tone: "text-sky-300" }
  ];
  return (
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-cyan-500/20 bg-[linear-gradient(165deg,hsl(var(--card)),rgba(15,23,42,0.97))] p-6 text-white shadow-[0_28px_80px_rgba(2,8,23,0.35)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-[10px] tracking-[0.35em] text-cyan-300/90">WMS · INVENTORY COMMAND</p>
          <h1 className="mt-2 text-2xl font-bold md:text-3xl">مركز المخزون الصناعي الذكي</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            ربط مباشر بالإنتاج والصيانة والقوالب والشحن — رؤية لحظية وتدفق مواد رقمي.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="border-emerald-500/40 bg-emerald-950/60 text-emerald-200">
            <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-live" />
            بث مباشر
          </Badge>
          <Button variant="outline" size="sm" className="border-white/20 bg-white/5 text-white hover:bg-white/10" asChild>
            <Link href="/ar/production">ربط الإنتاج</Link>
          </Button>
          <Button variant="outline" size="sm" className="border-white/20 bg-white/5 text-white hover:bg-white/10" asChild>
            <Link href="/ar/machines">الماكينات</Link>
          </Button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {items.map((it, i) => (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
          >
            <p className="text-[10px] text-slate-500">{it.label}</p>
            <p className={`mt-1 text-lg font-bold tabular-nums ${it.tone}`}>{it.value}</p>
          </motion.div>
        ))}
      </div>
    </motion.header>
  );
}

function SmartWarehouseMap({ lowStockCount }: { lowStockCount: number }) {
  const zones = [
    { id: "A", label: "منطقة أ — خام", x: 8, y: 18, w: 38, h: 52, heat: 0.85, critical: true },
    { id: "B", label: "منطقة ب — خام", x: 50, y: 18, w: 38, h: 24, heat: 0.55, critical: false },
    { id: "C", label: "منطقة ج — تغليف", x: 50, y: 46, w: 38, h: 24, heat: 0.42, critical: false },
    { id: "D", label: "شحن / جاهز", x: 8, y: 76, w: 80, h: 18, heat: 0.7, critical: lowStockCount > 4 }
  ];
  return (
    <Card className="erp-card overflow-hidden rounded-3xl border-cyan-500/15 bg-[linear-gradient(180deg,hsl(var(--card)),rgba(15,23,42,0.95))]">
      <CardHeader className="border-b border-border/80">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">خريطة المستودع الذكية</CardTitle>
          <Badge variant="info">Digital Twin · SVG</Badge>
        </div>
        <p className="text-xs text-muted-foreground">مناطق التخزين · كثافة حركة · مخزون حرِج</p>
      </CardHeader>
      <CardContent className="p-4">
        <div dir="ltr" className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#020617] p-3">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background:repeating-linear-gradient(0deg,rgba(34,211,238,0.05)_0,transparent_1px,transparent_8px)]" />
          <svg viewBox="0 0 100 100" className="relative z-[1] h-[220px] w-full">
            <defs>
              <linearGradient id="whGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(34,211,238,0.08)" />
                <stop offset="100%" stopColor="rgba(15,118,110,0.06)" />
              </linearGradient>
            </defs>
            <rect x="4" y="8" width="92" height="88" rx="3" fill="url(#whGrad)" stroke="rgba(34,211,238,0.25)" strokeWidth="0.4" />
            {zones.map((z) => (
              <motion.g key={z.id}>
                <motion.rect
                  x={z.x}
                  y={z.y}
                  width={z.w}
                  height={z.h}
                  rx="2"
                  fill={`rgba(16,185,129,${0.06 + z.heat * 0.35})`}
                  stroke={z.critical ? "rgba(245,158,11,0.9)" : "rgba(148,163,184,0.35)"}
                  strokeWidth={z.critical ? 0.5 : 0.35}
                  animate={z.critical ? { opacity: [0.75, 1, 0.75] } : { opacity: [0.85, 1, 0.85] }}
                  transition={{ repeat: Infinity, duration: z.critical ? 1.2 : 3 }}
                />
                <text x={z.x + 2} y={z.y + 5} fill="#cbd5e1" fontSize="3.2" fontWeight={600}>
                  {z.label}
                </text>
              </motion.g>
            ))}
            <motion.path
              d="M 27 44 L 50 30 L 69 44 L 50 58 Z"
              fill="none"
              stroke="rgba(34,211,238,0.35)"
              strokeWidth="0.35"
              strokeDasharray="2 2"
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: -6 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            />
          </svg>
          <p className="mt-2 text-center text-[10px] text-slate-500">الكثافة الخضراء ≈ حركة مرتفعة · الإطار الكهرماني = منطقة حرِجة</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsPanel({ dashboard }: { dashboard: LiveDashboard }) {
  const invAlerts = [
    { t: "نقص PP في الخلية A-12", sev: "critical" as const },
    { t: "Masterbatch قرب حد إعادة الطلب", sev: "warning" as const },
    { t: "تجاوز مخزون كراتين منطقة P", sev: "info" as const }
  ];
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          تنبيهات ذكية
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {invAlerts.map((a) => (
          <div
            key={a.t}
            className={`rounded-xl border p-3 text-sm ${
              a.sev === "critical"
                ? "border-rose-500/40 bg-rose-500/10 text-rose-100"
                : a.sev === "warning"
                  ? "border-amber-500/35 bg-amber-500/10 text-amber-100"
                  : "border-sky-500/30 bg-sky-500/10 text-sky-100"
            }`}
          >
            {a.t}
          </div>
        ))}
        {dashboard.alerts.slice(0, 2).map((a) => (
          <div key={a.id} className="rounded-xl border border-border bg-muted/40 p-2 text-xs text-muted-foreground">
            MES: {a.message}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function VisualCategoryCards({
  active,
  onSelect
}: {
  active: MaterialCategory | "all";
  onSelect: (c: MaterialCategory | "all") => void;
}) {
  const items: Array<{ id: MaterialCategory; label: string; hint: string; icon: React.ComponentType<{ className?: string }>; count: number }> = [
    { id: "raw", label: "مواد خام", hint: "PP · PE · masterbatch", icon: Package, count: mockMaterials.filter((m) => m.category === "raw").length },
    { id: "finished", label: "منتجات تامة", hint: "جاهز للبيع", icon: PackageOpen, count: mockMaterials.filter((m) => m.category === "finished").length },
    { id: "packaging", label: "تغليف", hint: "كراتين وأفلام", icon: Truck, count: mockMaterials.filter((m) => m.category === "packaging").length },
    { id: "spare", label: "قطع غيار", hint: "صيانة", icon: Hammer, count: mockMaterials.filter((m) => m.category === "spare").length },
    { id: "mold", label: "قوالب", hint: "تخزين صيانة الدورات", icon: Layers, count: 0 },
    { id: "waste", label: "هدر وتدوير", hint: "إعادة طحن", icon: Recycle, count: 3 }
  ];
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((it, i) => {
        const selected = active === it.id || active === "all";
        return (
          <motion.button
            key={it.id}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(it.id)}
            className={`rounded-2xl border p-4 text-right transition ${active === it.id ? "border-cyan-400/45 bg-cyan-500/10 shadow-[0_0_28px_rgba(34,211,238,0.12)]" : "border-border bg-card/80 hover:border-cyan-500/25"}`}
          >
            <it.icon className={`mb-2 h-6 w-6 ${active === it.id ? "text-cyan-300" : "text-muted-foreground"}`} />
            <p className="text-sm font-semibold">{it.label}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{it.hint}</p>
            <p className={`mt-2 text-2xl font-bold tabular-nums ${selected ? "text-foreground" : "text-muted-foreground"}`}>{it.count}</p>
          </motion.button>
        );
      })}
    </section>
  );
}

function CategoryStrip({
  active,
  onSelect
}: {
  active: MaterialCategory | "all";
  onSelect: (c: MaterialCategory | "all") => void;
}) {
  const cats: Array<{ id: MaterialCategory | "all"; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "all", label: "الكل", icon: Boxes },
    { id: "raw", label: "مواد خام", icon: Package },
    { id: "finished", label: "منتجات تامة", icon: PackageOpen },
    { id: "packaging", label: "تغليف", icon: Truck },
    { id: "spare", label: "قطع غيار", icon: Hammer },
    { id: "mold", label: "قوالب", icon: Layers },
    { id: "waste", label: "هدر وتدوير", icon: Recycle }
  ];
  return (
    <section className="flex flex-wrap gap-2">
      {cats.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelect(c.id)}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
            active === c.id ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-100" : "border-border bg-card/80"
          }`}
        >
          <c.icon className="h-4 w-4 opacity-90" />
          {c.label}
        </button>
      ))}
    </section>
  );
}

function FlowVisualization() {
  const stages = [
    { key: "raw", label: "مواد خام", icon: Package },
    { key: "prod", label: "إنتاج", icon: Cpu },
    { key: "pack", label: "تغليف", icon: PackageOpen },
    { key: "wh", label: "مستودع", icon: Warehouse },
    { key: "ship", label: "شحن", icon: Ship }
  ];
  return (
    <Card className="erp-card rounded-3xl border border-cyan-500/10">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-cyan-400" />
          تدفق المخزون الصناعي
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div dir="ltr" className="flex flex-wrap items-center justify-center gap-1 md:gap-3">
          {stages.map((s, i) => (
            <motion.div key={s.key} className="relative z-[1] flex items-center gap-1">
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(34,211,238,0)",
                    "0 0 24px rgba(34,211,238,0.25)",
                    "0 0 0 0 rgba(34,211,238,0)"
                  ]
                }}
                transition={{ repeat: Infinity, duration: 2.4 }}
                className="flex flex-col items-center rounded-xl border border-cyan-500/30 bg-slate-950/60 px-4 py-3 text-center backdrop-blur-sm"
              >
                <s.icon className="h-5 w-5 text-cyan-300" />
                <span className="mt-1 text-[11px] font-medium text-slate-200">{s.label}</span>
              </motion.div>
              {i < stages.length - 1 ? (
                <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.4 }}>
                  <ArrowRight className="mx-1 h-5 w-5 text-cyan-500/55" />
                </motion.div>
              ) : null}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MaterialCard({
  material,
  index,
  machines
}: {
  material: MaterialItem;
  index: number;
  machines: MachineSnapshot[];
}) {
  const qBadge =
    material.quality === "approved"
      ? { variant: "success" as const, label: "معتمد" }
      : material.quality === "hold"
        ? { variant: "destructive" as const, label: "حجز" }
        : { variant: "warning" as const, label: "فحص" };
  const prodLink = (machines[0]?.id ? `/ar/machines/${machines[0].id}` : "/ar/production") as Route;
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="erp-card group overflow-hidden rounded-2xl border border-border"
    >
      <div className="relative h-36 border-b border-border">
        <img src={material.image} alt="" className="h-full w-full object-cover opacity-95 transition group-hover:scale-[1.02]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/95 to-transparent" />
        <Badge className="absolute right-2 top-2" variant={qBadge.variant}>
          {qBadge.label}
        </Badge>
        <p className="absolute bottom-2 right-2 left-2 text-sm font-bold text-white">{material.name}</p>
      </div>
      <CardContent className="space-y-2 p-4 text-sm">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">الكود</span>
          <span className="font-mono font-semibold">{material.id}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-muted-foreground">الكمية</span>
            <p className="font-semibold">
              {material.qty.toLocaleString("ar")} {material.unit}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">الموقع</span>
            <p className="font-semibold">{material.location}</p>
          </div>
          <div>
            <span className="text-muted-foreground">معدل الاستهلاك</span>
            <p className="font-semibold">{material.consumptionKgPerDay.toLocaleString("ar")} كغ/يوم</p>
          </div>
          <div>
            <span className="text-muted-foreground">أيام متبقية</span>
            <p className={`font-semibold ${material.remainingDays < 10 ? "text-amber-400" : ""}`}>{material.remainingDays}</p>
          </div>
          <div>
            <span className="text-muted-foreground">المورد</span>
            <p className="font-medium">{material.supplier}</p>
          </div>
          <div>
            <span className="text-muted-foreground">التكلفة</span>
            <p className="font-medium">${material.unitCost}</p>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" className="flex-1 text-xs" asChild>
            <Link href={prodLink}>تأثير الإنتاج</Link>
          </Button>
        </div>
      </CardContent>
    </motion.article>
  );
}

function ProductionConnection({ dashboard }: { dashboard: LiveDashboard }) {
  const active = dashboard.machines.filter((m) => m.status === "running").length;
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Cpu className="h-4 w-4 text-emerald-400" />
          ربط الإنتاج المباشر
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 text-emerald-100">
          أوامر نشطة مرتبطة بالمواد: <span className="font-bold">{active}</span> ماكينة تشغيل · استهلاك لحظي من خلايا A و B.
        </p>
        <div className="grid gap-2 text-xs text-muted-foreground">
          <p>• خصم تلقائي عند تسجيل دفعات الإنتاج (واجهة المشرف).</p>
          <p>• أولوية التغذية: PP → خط الحقن، PET → النفخ.</p>
        </div>
        <Button variant="industrial" size="sm" className="w-full" asChild>
          <Link href="/ar/production/operations">إدخال استهلاك / إنتاج</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function MaintenanceSpares({ machines }: { machines: MachineSnapshot[] }) {
  const critical = machines.filter((m) => m.status === "maintenance" || m.activeAlert);
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Hammer className="h-4 w-4 text-amber-400" />
          قطع غيار والصيانة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {critical.length === 0 ? (
          <p className="text-muted-foreground">لا توجد مهام صيانة حرِجة مرتبطة بقطع تلقائياً.</p>
        ) : (
          critical.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2">
              <span className="font-medium">{m.code}</span>
              <Badge variant="warning">تنبؤ استهلاك قطع</Badge>
            </div>
          ))
        )}
        <p className="text-xs text-muted-foreground">ربط تلقائي مع تذاكر الصيانة وقائمة S-MAINT.</p>
        <Button size="sm" variant="outline" className="w-full" asChild>
          <Link href="/ar/admin">لوحة الصيانة</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function WasteRecyclingSection({ wasteRate }: { wasteRate: number }) {
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Recycle className="h-4 w-4 text-teal-400" />
          الهدر والتدوير
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-4 text-sm">
        <div className="rounded-xl border border-border bg-background/60 p-3">
          <p className="text-xs text-muted-foreground">هدر مصنعي</p>
          <p className="mt-1 text-xl font-bold text-amber-400">{wasteRate}%</p>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-3">
          <p className="text-xs text-muted-foreground">كمية تدوير اليوم</p>
          <p className="mt-1 font-bold">1,240 كغ</p>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-3">
          <p className="text-xs text-muted-foreground">إعادة استخدام</p>
          <p className="mt-1 font-bold text-emerald-400">62%</p>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-3">
          <p className="text-xs text-muted-foreground">أسباب شائعة</p>
          <p className="mt-1 text-xs">أبعاد، لون، تسخين بارد</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MoldStorageSection({
  molds
}: {
  molds: Array<{ code: string; machine: string; health: number; lastUse: string; cycles: number; maint: string }>;
}) {
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Layers className="h-4 w-4 text-violet-400" />
          مخزون القوالب
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-border text-right text-[11px] text-muted-foreground">
              <th className="py-2">قالب</th>
              <th className="py-2">ماكينة</th>
              <th className="py-2">صحة</th>
              <th className="py-2">آخر استخدام</th>
              <th className="py-2">دورات</th>
              <th className="py-2">صيانة</th>
            </tr>
          </thead>
          <tbody>
            {molds.map((row) => (
              <tr key={row.machine + row.code} className="border-b border-border/60">
                <td className="py-2 font-medium">{row.code}</td>
                <td className="py-2">{row.machine}</td>
                <td className="py-2">
                  <span className={row.health < 55 ? "text-rose-400" : row.health < 75 ? "text-amber-400" : "text-emerald-400"}>{row.health}%</span>
                </td>
                <td className="py-2 text-muted-foreground">{row.lastUse}</td>
                <td className="py-2 tabular-nums">{row.cycles.toLocaleString("ar")}</td>
                <td className="py-2">
                  <Badge variant={row.maint !== "طبيعي" ? "warning" : "secondary"}>{row.maint}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function LiveStockStrip({ kpis }: { kpis: LiveDashboard["kpis"] }) {
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Gauge className="h-4 w-4" />
          مراقبة المخزون اللحظية
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div className="rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground">استهلاك متزامن مع الإنتاج</p>
          <p className="mt-1 font-bold text-cyan-400">{Math.round(kpis.producedWeightKgToday * 0.72).toLocaleString("ar")} كغ/يوم تقدير</p>
        </div>
        <div className="rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground">حد إعادة الطلب (خام)</p>
          <p className="mt-1 font-bold">عند &lt; 8 أيام تغطية</p>
        </div>
        <div className="rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground">بنود منخفضة (KPI)</p>
          <p className="mt-1 font-bold text-amber-400">{kpis.lowStockItems}</p>
        </div>
        <div className="rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground">الخصم اللحظي من الأوامر النشطة</p>
          <p className="mt-1 text-xs text-muted-foreground">متزامن مع واجهة المشرف والـ MES</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsSection() {
  return (
    <Card className="erp-card rounded-3xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          تحليلات المخزون
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8 lg:grid-cols-2">
        <div className="h-52">
          <p className="mb-2 text-xs text-muted-foreground">دوران المخزون × تحليل الهدر</p>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={turnoverData}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Area type="monotone" dataKey="turn" name="دوران" stroke="#22d3ee" fill="rgba(34,211,238,0.15)" />
              <Area type="monotone" dataKey="waste" name="هدر %" stroke="#f97316" fill="rgba(249,115,22,0.1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="h-52">
          <p className="mb-2 text-xs text-muted-foreground">كفاءة استغلال المناطق</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={warehouseEffData}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="z" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Tooltip />
              <Bar dataKey="u" fill="#38bdf8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
