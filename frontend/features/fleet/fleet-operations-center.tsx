"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Battery,
  Bus,
  Disc,
  Car,
  Clock,
  DollarSign,
  FileWarning,
  Fuel,
  Gauge,
  GaugeCircle,
  MapPin,
  Package,
  Radio,
  Route as RouteIcon,
  ShieldAlert,
  ThermometerSun,
  Timer,
  Truck,
  Warehouse,
  Wrench,
  Zap,
  Cpu,
  ClipboardList,
  Boxes,
  TrendingUp
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LiveDashboard } from "@/types/factory";

export type FleetStatus = "active" | "idle" | "maintenance" | "out_of_service" | "emergency";

export type FleetCategory =
  | "transport_truck"
  | "delivery"
  | "forklift"
  | "admin_car"
  | "staff_transport"
  | "maintenance_vehicle"
  | "emergency";

export interface FleetVehicle {
  id: string;
  plate: string;
  name: string;
  category: FleetCategory;
  categoryLabel: string;
  driver: string | null;
  location: string;
  status: FleetStatus;
  fuelPct: number;
  odometerKm: number;
  engineHours: number;
  maintHealth: number;
  insuranceOk: boolean;
  regExpiryDays: number;
  avatarHue: number;
  tireOk: boolean;
  mission: string;
}

function seed(s: string, m: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % Math.max(1, m);
}

const CATEGORY_META: Record<FleetCategory, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  transport_truck: { label: "شاحنات نقل", icon: Truck },
  delivery: { label: "مركبات توصيل", icon: Package },
  forklift: { label: "رافعات شوكية", icon: Warehouse },
  admin_car: { label: "سيارات إدارية", icon: Car },
  staff_transport: { label: "نقل الموظفين", icon: Bus },
  maintenance_vehicle: { label: "مركبات صيانة", icon: Wrench },
  emergency: { label: "طوارئ", icon: ShieldAlert }
};

function buildFleet(dashboard: LiveDashboard): FleetVehicle[] {
  const drivers = ["محمد", "سامر", "وليد", "علي", "ناصر", "رامي", "خالد", "فهد"];
  const locs = ["البوابة الرئيسية", "مستودع الخام", "رصيف التحميل أ", "قاعة الحقن", "قاعة النفخ", "موقف الإدارة", "طريق سريع 65", "ورشة الأسطول"];
  const specs: Array<{ cat: FleetCategory; plate: string; name: string }> = [
    { cat: "transport_truck", plate: "ABC-1024", name: "مرسيدس أكتروس — نقل رولات" },
    { cat: "transport_truck", plate: "ABC-2041", name: "فولفو — نقل PP" },
    { cat: "delivery", plate: "XYZ-5510", name: "فان توصيل عبوات" },
    { cat: "delivery", plate: "XYZ-5511", name: "فان تبريد خفيف" },
    { cat: "forklift", plate: "FL-01", name: "رافعة كوماتسو 3 طن" },
    { cat: "forklift", plate: "FL-04", name: "رافعة كهربائية مستودع" },
    { cat: "admin_car", plate: "ADM-900", name: "سيدان إدارية" },
    { cat: "staff_transport", plate: "BUS-208", name: "باص ورديات" },
    { cat: "maintenance_vehicle", plate: "SVC-12", name: "بيك أب ورشة" },
    { cat: "emergency", plate: "EMR-01", name: "مركبة طوارئ/إطفاء خفيف" },
    { cat: "delivery", plate: "XYZ-5512", name: "قلاب داخلي" },
    { cat: "forklift", plate: "FL-02", name: "رافعة خط التغليف" }
  ];
  const load = dashboard.kpis.machineUtilization;
  return specs.map((s, i) => {
    const stRoll = seed(s.plate + "st", 24);
    const status: FleetStatus =
      stRoll === 0
        ? "maintenance"
        : stRoll === 1
          ? "idle"
          : stRoll === 2
            ? "out_of_service"
            : stRoll === 3 && load > 75
              ? "emergency"
              : "active";
    const mh = Math.max(
      22,
      96 - seed(s.plate + "mh", 30) - (status === "maintenance" ? 25 : 0) - dashboard.kpis.openMaintenanceTickets * 2
    );
    return {
      id: `v-${i}`,
      plate: s.plate,
      name: s.name,
      category: s.cat,
      categoryLabel: CATEGORY_META[s.cat].label,
      driver: status === "out_of_service" ? null : drivers[seed(s.plate, drivers.length)],
      location: locs[seed(s.plate + "L", locs.length)],
      status,
      fuelPct: 35 + seed(s.plate + "f", 60),
      odometerKm: 42000 + seed(s.plate + "o", 180000),
      engineHours: 1200 + seed(s.plate + "e", 8000),
      maintHealth: Math.min(100, mh),
      insuranceOk: seed(s.plate + "i", 10) > 1,
      regExpiryDays: 15 + seed(s.plate + "r", 340),
      avatarHue: seed(s.plate, 360),
      tireOk: seed(s.plate + "t", 12) > 2,
      mission:
        status === "active"
          ? ["نقل خام PP", "توصيل طلبية", "تغذية خط", "نقل موظفين وردية", "مهمة صيانة ميدانية", "جاهزية طوارئ"][
              seed(s.plate + "m", 6)
            ]
          : status === "idle"
            ? "في الانتظار — طابور المستودع"
            : status === "maintenance"
              ? "صيانة مجدولة / ورشة"
              : "خارج الخدمة"
    };
  });
}

type Props = { dashboard: LiveDashboard };

export function FleetOperationsCenter({ dashboard }: Props) {
  const [tick, setTick] = useState(0);
  const [catFilter, setCatFilter] = useState<FleetCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<FleetStatus | "all">("all");

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 2400);
    return () => window.clearInterval(id);
  }, []);

  const vehicles = useMemo(() => buildFleet(dashboard), [dashboard]);

  const filtered = vehicles.filter((v) => {
    if (catFilter !== "all" && v.category !== catFilter) return false;
    if (statusFilter !== "all" && v.status !== statusFilter) return false;
    return true;
  });

  const total = vehicles.length;
  const active = vehicles.filter((v) => v.status === "active").length;
  const maintenance = vehicles.filter((v) => v.status === "maintenance").length;
  const dailyFuelLiters = Math.round(280 + dashboard.kpis.producedPiecesToday * 0.009 + seed("fuel", 40));
  const fuelCostDaily = Math.round(dailyFuelLiters * 2.15 + seed("fuelc", 200));
  const fleetOpCost = Math.round(fuelCostDaily * 1.35 + maintenance * 420 + dashboard.kpis.openMaintenanceTickets * 180);
  const maintTasksUpcoming =
    dashboard.kpis.openMaintenanceTickets +
    vehicles.filter((v) => v.maintHealth < 72).length +
    seed("tsk", 3);
  const healthScore = Math.max(
    28,
    Math.min(
      98,
      Math.round(
        (active / Math.max(1, total)) * 38 +
          vehicles.reduce((s, v) => s + v.maintHealth, 0) / total * 0.45 +
          (100 - dashboard.kpis.wasteRate * 2) * 0.17
      )
    )
  );

  const categoryStats = (Object.keys(CATEGORY_META) as FleetCategory[]).map((c) => {
    const vs = vehicles.filter((v) => v.category === c);
    const activeC = vs.filter((v) => v.status === "active").length;
    const maintC = vs.filter((v) => v.status === "maintenance").length;
    const fuelAvg = vs.length ? Math.round(vs.reduce((s, v) => s + v.fuelPct * 40, 0) / vs.length) : 0;
    return {
      cat: c,
      ...CATEGORY_META[c],
      count: vs.length,
      active: activeC,
      maint: maintC,
      fuelIndex: fuelAvg
    };
  });

  const fuelTrend = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"].map((d, i) => ({
    d,
    liters: Math.round(220 + seed(d + "L", 120) + i * 8 + dashboard.kpis.producedPiecesToday * 0.005),
    cost: Math.round((220 + seed(d + "L", 120)) * 2.1)
  }));

  const maintCostTrend = fuelTrend.map((x, i) => ({
    ...x,
    maint: Math.round(800 + seed(`m${i}`, 900) + maintenance * 50)
  }));

  const vehicleFuelRank = [...vehicles]
    .sort((a, b) => seed(b.plate + "cons", 100) - seed(a.plate + "cons", 100))
    .slice(0, 6)
    .map((v) => ({
      plate: v.plate,
      eff: Math.round(5 + seed(v.plate + "eff", 8) * 0.1),
      score: seed(v.plate + "cons", 100)
    }));

  const utilizationSeries = vehicles.map((v, i) => ({
    name: v.plate,
    util: Math.min(100, 40 + seed(v.id + "u", 55) + (v.status === "active" ? 18 : 0)),
    idx: i
  }));

  const spareStock = [
    { item: "فلاتر زيت محرك", qty: 24, min: 8, crit: false },
    { item: "زيت هيدروليك رافعات", qty: 6, min: 10, crit: true },
    { item: "إطارات شوكية", qty: 3, min: 4, crit: true },
    { item: "فلاتر هواء", qty: 18, min: 6, crit: false },
    { item: "شمعات / مستهلكات", qty: 40, min: 12, crit: false }
  ];

  const drivers = useMemo(() => {
    const names = Array.from(new Set(vehicles.map((v) => v.driver).filter(Boolean))) as string[];
    return names.map((n) => ({
      name: n,
      eff: 6 + seed(n + "de", 25) / 10,
      viol: seed(n + "v", 4),
      licDays: 30 + seed(n + "lic", 300),
      trips: 12 + seed(n + "tr", 40)
    }));
  }, [vehicles]);

  const trips = [
    { id: "T-901", route: "مستودع خام → قاعة الحقن", v: "FL-01", state: "active", delay: 0 },
    { id: "T-902", route: "مصنع → عميل الواحة", v: "XYZ-5510", state: "active", delay: 8 },
    { id: "T-903", route: "نقل وردية صباحية", v: "BUS-208", state: "completed", delay: 0 },
    { id: "T-904", route: "توريد PP برّي", v: "ABC-1024", state: "delayed", delay: 45 }
  ];

  const aiAlerts = [
    vehicles.some((v) => v.maintHealth < 55)
      ? { level: "crit" as const, text: "خطر تأخير صيانة — مركبة بمؤشر صحة منخفض (<55)." }
      : null,
    dailyFuelLiters > 400
      ? { level: "warn" as const, text: "استهلاك وقود يومي مرتفع مقارنة بمتوسط الأسبوع." }
      : null,
    vehicles.some((v) => !v.tireOk)
      ? { level: "warn" as const, text: "تآكل إطارات مُبلّغ — جدولة فحص خلال 48 ساعة." }
      : null,
    { level: "info" as const, text: `تكامل مخزون: ${dashboard.kpis.lowStockItems} بنود منخفضة قد تشمل قطع الأسطول.` },
    dashboard.kpis.machineUtilization > 82
      ? { level: "info" as const, text: "حمولة مصنع مرتفعة — ضاعف الأولوية لمركبات التغذية الداخلية." }
      : null
  ].filter(Boolean) as Array<{ level: "crit" | "warn" | "info"; text: string }>;

  const preventive = vehicles.slice(0, 6).map((v, i) => {
    const nextOilKm = Math.max(0, 5000 - (v.odometerKm % 5000));
    const filterKm = Math.max(0, 10000 - (v.odometerKm % 10000));
    const tireDays = Math.max(0, 30 - (seed(v.plate + "td", 40) % 30));
    const urgent = Math.min(nextOilKm, filterKm) < 1200 || v.maintHealth < 62;
    return {
      plate: v.plate,
      nextOilKm,
      filterKm,
      tireDays,
      urgent,
      inspect: `${14 + seed(v.id + "in", 20)} يوم`
    };
  });

  return (
    <main className="min-h-screen bg-background p-4 text-foreground md:p-6">
      <div className="mx-auto max-w-[1920px] space-y-6" dir="rtl">
        <motion.header
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="erp-card relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-4 md:p-6"
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,hsl(var(--primary)/0.08),transparent_42%)]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
                <Truck className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-[10px] tracking-[0.3em] text-primary/90">FLEET · LOGISTICS · OPS</p>
                <h1 className="mt-1 text-2xl font-bold md:text-3xl">مركز عمليات الأسطول والمركبات</h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  منصّة لوجستية صناعية تربط الصيانة، المخزون، الوقود، المحاسبة، والقوى العاملة — ليس تعقبGPS تقليدي، بل لوحة تحكّم
                  أسطول ذكية متصلة بالمصنع.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-primary/40 text-xs">
                <Radio className="ml-1 h-3 w-3 pulse-live text-primary" />
                بث تشغيلي #{tick}
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <Link href={"/ar/inventory" as Route}>مخزون القطع</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={"/ar/admin" as Route}>صيانة المصنع</Link>
              </Button>
              <Button variant="secondary" size="sm" asChild>
                <Link href={"/ar/workforce" as Route}>السائقون / الموارد البشرية</Link>
              </Button>
            </div>
          </div>

          <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <HeaderKpi icon={Truck} label="إجمالي المركبات" value={total.toString()} accent="text-primary" />
            <HeaderKpi icon={Activity} label="نشطة" value={active.toString()} accent="text-emerald-600 dark:text-emerald-400" />
            <HeaderKpi icon={Wrench} label="تحت الصيانة" value={maintenance.toString()} accent="text-amber-600 dark:text-amber-400" />
            <HeaderKpi icon={Fuel} label="وقود يومي (ل)" value={dailyFuelLiters.toLocaleString("ar")} accent="text-sky-600 dark:text-sky-400" />
            <HeaderKpi icon={DollarSign} label="تكلفة تشغيل تقديرية" value={fleetOpCost.toLocaleString("ar")} sub="ر.س" accent="text-violet-600 dark:text-violet-400" />
            <HeaderKpi icon={GaugeCircle} label="صحة الأسطول" value={`${healthScore}`} suffix="%" accent="text-cyan-600 dark:text-cyan-400" />
            <HeaderKpi icon={ClipboardList} label="مهام صيانة قادمة" value={maintTasksUpcoming.toString()} accent="text-foreground" />
            <HeaderKpi icon={AlertTriangle} label="تنبيهات حرجة" value={dashboard.alerts.filter((a) => a.severity === "critical").length.toString()} accent="text-destructive" />
          </div>
        </motion.header>

        <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <CategoryStrip stats={categoryStats} />

            <Card className="erp-card border-border">
              <CardHeader className="flex flex-wrap items-center justify-between gap-2 pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Car className="h-5 w-5 text-primary" />
                  بطاقات المركبات الذكية
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <FilterBtn active={catFilter === "all"} onClick={() => setCatFilter("all")}>
                    الكل
                  </FilterBtn>
                  {(Object.keys(CATEGORY_META) as FleetCategory[]).map((c) => (
                    <FilterBtn key={c} active={catFilter === c} onClick={() => setCatFilter(c)}>
                      {CATEGORY_META[c].label}
                    </FilterBtn>
                  ))}
                  <FilterBtn active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
                    كل الحالات
                  </FilterBtn>
                  {(["active", "idle", "maintenance", "emergency"] as FleetStatus[]).map((s) => (
                    <FilterBtn key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                      {statusLabel(s)}
                    </FilterBtn>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((v, i) => (
                      <VehicleCard key={v.id} v={v} tick={tick + i} />
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <LiveTelemetryPanel vehicles={vehicles} tick={tick} />
              <FleetMiniMap vehicles={vehicles} tick={tick} />
            </div>

            <FuelCenter
              fuelTrend={fuelTrend}
              dailyFuelLiters={dailyFuelLiters}
              fuelCostDaily={fuelCostDaily}
              rankings={vehicleFuelRank}
              dashboard={dashboard}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <MaintenanceCenter vehicles={vehicles} maintCostTrend={maintCostTrend} preventive={preventive} />
              <DriverPerformance drivers={drivers} />
            </div>

            <OperationsTasks trips={trips} />

            <InventoryBridge spareStock={spareStock} dashboard={dashboard} />

            <AccountingCharts
              fleetOpCost={fleetOpCost}
              fuelCostDaily={fuelCostDaily}
              utilizationSeries={utilizationSeries}
              maintenance={maintenance}
            />

            <ComplianceDocs vehicles={vehicles} />

            <AiInsights alerts={aiAlerts} />

            <PerformanceFooter vehicles={vehicles} fuelTrend={fuelTrend} />
          </div>

          <div className="space-y-6">
            <SideAlerts dashboard={dashboard} vehicles={vehicles} dailyFuelLiters={dailyFuelLiters} />
            <FleetHeatSummary vehicles={vehicles} />
          </div>
        </section>
      </div>
    </main>
  );
}

function HeaderKpi({
  icon: Icon,
  label,
  value,
  sub,
  suffix,
  accent
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  suffix?: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3 dark:bg-muted/15">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={`mt-1 text-lg font-bold tabular-nums ${accent}`}>
        {value}
        {suffix ? <span className="mr-1 text-xs font-normal opacity-70">{suffix}</span> : null}
        {sub ? <span className="mr-1 text-[10px] font-normal opacity-60">{sub}</span> : null}
      </p>
    </div>
  );
}

function FilterBtn({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition ${active ? "border-primary bg-primary/15 text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted/50"}`}
    >
      {children}
    </button>
  );
}

function statusLabel(s: FleetStatus) {
  const m: Record<FleetStatus, string> = {
    active: "نشط",
    idle: "خامل",
    maintenance: "صيانة",
    out_of_service: "خارج الخدمة",
    emergency: "طوارئ"
  };
  return m[s];
}

function statusBadgeClass(s: FleetStatus) {
  const m: Record<FleetStatus, string> = {
    active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    idle: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
    maintenance: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
    out_of_service: "bg-muted text-muted-foreground",
    emergency: "bg-destructive/15 text-destructive"
  };
  return m[s];
}

function CategoryStrip({
  stats
}: {
  stats: Array<{
    cat: FleetCategory;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count: number;
    active: number;
    maint: number;
    fuelIndex: number;
  }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <motion.div
            key={s.cat}
            whileHover={{ y: -2 }}
            className="erp-card rounded-2xl border border-border bg-card p-4"
          >
            <Icon className="mb-2 h-6 w-6 text-primary" />
            <p className="text-xs font-semibold">{s.label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{s.count}</p>
            <p className="text-[11px] text-muted-foreground">نشطة {s.active} · صيانة {s.maint}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">مؤشر وقود: {s.fuelIndex} ل/مئوية تقريبية</p>
          </motion.div>
        );
      })}
    </div>
  );
}

function VehicleCard({ v, tick }: { v: FleetVehicle; tick: number }) {
  const jitter = 1 + 0.02 * Math.sin(tick / 2);
  const temp = Math.round(88 + seed(v.plate + String(tick), 12) + (v.status === "active" ? 4 : 0));
  const batt = Math.min(100, Math.round(v.maintHealth - 5 + Math.sin(tick / 3) * 2));
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="erp-card overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div
        className="relative h-28 w-full bg-gradient-to-br from-slate-800/90 to-slate-950 flex items-center justify-center"
        style={{
          boxShadow: `inset 0 0 40px hsl(${v.avatarHue} 40% 20% / 0.35)`
        }}
      >
        <span className="text-5xl opacity-45 grayscale contrast-125">{v.category === "forklift" ? "🛻" : v.category.includes("truck") ? "🚛" : v.category === "staff_transport" ? "🚌" : "🚐"}</span>
        <Badge className={`absolute left-3 top-3 ${statusBadgeClass(v.status)}`}>{statusLabel(v.status)}</Badge>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-lg font-bold">{v.plate}</p>
            <p className="text-[11px] text-muted-foreground">{v.categoryLabel}</p>
            <p className="mt-1 text-xs font-medium">{v.name}</p>
          </div>
          <div className="text-left text-[10px] text-muted-foreground">
            تأمين: {v.insuranceOk ? "ساري" : "ينتهي قريباً"}
            <br />
            تعميد: متبقي {v.regExpiryDays} يوم
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2 py-1.5 dark:bg-muted/15">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>{v.location}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2 py-1.5 dark:bg-muted/15">
            <Cpu className="h-3.5 w-3.5 text-violet-500" />
            <span>{v.driver ?? "لا سائق"}</span>
          </div>
          <MiniGauge icon={Fuel} label="وقود %" value={`${Math.round(v.fuelPct * jitter)}%`} color="text-sky-500" />
          <MiniGauge icon={Gauge} label="عداد" value={`${(v.odometerKm / 1000).toFixed(1)}k`} />
          <MiniGauge icon={Timer} label="ساعات" value={`${v.engineHours}h`} />
          <MiniGauge icon={GaugeCircle} label="صيانة %" value={`${v.maintHealth}%`} color={v.maintHealth < 60 ? "text-destructive" : "text-emerald-500"} />
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border pt-2 text-[10px]">
          <span className={`inline-flex items-center gap-1 ${v.tireOk ? "text-emerald-600" : "text-destructive"}`}>
            <Disc className="h-3 w-3" />
            إطارات {v.tireOk ? "جيدة" : "مراجعة"}
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <ThermometerSun className="h-3 w-3 text-orange-400" /> {temp}°C
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Battery className="h-3 w-3 text-green-400" /> {batt}%
          </span>
        </div>
        <p className="rounded-lg bg-primary/5 px-2 py-1 text-[11px] text-primary">
          <RouteIcon className="ml-1 inline h-3.5 w-3.5" />
          المهمة: {v.mission}
        </p>
      </div>
    </motion.div>
  );
}

function MiniGauge({
  icon: Icon,
  label,
  value,
  color
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-2 py-1.5 dark:bg-muted/10">
      <Icon className={`h-3.5 w-3.5 ${color ?? "text-primary"}`} />
      <div>
        <p className="text-[9px] text-muted-foreground">{label}</p>
        <p className={`font-mono font-semibold ${color ?? "text-card-foreground"}`}>{value}</p>
      </div>
    </div>
  );
}

function LiveTelemetryPanel({ vehicles, tick }: { vehicles: FleetVehicle[]; tick: number }) {
  const sample = vehicles.slice(0, 5);
  return (
    <Card className="erp-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className="h-5 w-5 text-primary pulse-live" />
          مراقبة لحظية — تليمتري تشغيلي
        </CardTitle>
        <p className="text-xs text-muted-foreground">استهلاك، مسافة، حرارة، بطارية، سائق، مهمة — محاكاة SCADA لوجستي.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {sample.map((v) => (
          <div key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/25 px-3 py-2 text-xs dark:bg-muted/10">
            <span className="font-mono font-bold">{v.plate}</span>
            <span className="text-muted-foreground">وقود {Math.round(v.fuelPct + Math.sin((tick + v.odometerKm) / 40) * 2)}%</span>
            <span>{Math.round((v.odometerKm % 800) + tick * 0.12)}كم اليوم</span>
            <span className={v.status === "active" ? "text-emerald-500" : "text-muted-foreground"}>{statusLabel(v.status)}</span>
            <Badge variant="outline" className="text-[10px]">
              {v.mission.slice(0, 18)}…
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function FleetMiniMap({ vehicles, tick }: { vehicles: FleetVehicle[]; tick: number }) {
  const nodes = vehicles.slice(0, 8).map((v, i) => ({
    vx: 12 + (i % 4) * 22 + Math.sin((tick + i) / 4) * 2,
    vy: 20 + Math.floor(i / 4) * 35 + Math.cos((tick + i) / 5) * 2,
    plate: v.plate,
    s: v.status
  }));
  return (
    <Card className="erp-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-5 w-5 text-primary" />
          خريطة عمليات مصغّرة
        </CardTitle>
        <p className="text-xs text-muted-foreground">مواقع نسبية، مسارات نشطة، تدفق تغذية المصنع.</p>
      </CardHeader>
      <CardContent dir="ltr">
        <svg viewBox="0 0 100 70" className="factory-grid h-[220px] w-full rounded-xl border border-primary/20 bg-muted/30 dark:bg-factory-panel/60">
          <defs>
            <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(14,165,233,0.35)" />
              <stop offset="100%" stopColor="rgba(34,197,94,0.2)" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="96" height="66" rx="2" fill="url(#routeGrad)" stroke="hsl(var(--primary) / 0.25)" strokeWidth="0.4" />
          <rect x="6" y="10" width="28" height="22" rx="1" fill="rgba(15,23,42,0.5)" stroke="rgba(148,163,184,0.35)" />
          <text x="8" y="18" fill="#94a3b8" fontSize="4">مستودع</text>
          <rect x="40" y="8" width="24" height="28" rx="1" fill="rgba(15,23,42,0.45)" stroke="rgba(34,197,94,0.25)" />
          <text x="42" y="16" fill="#94a3b8" fontSize="4">إنتاج</text>
          <rect x="72" y="40" width="22" height="18" rx="1" fill="rgba(15,23,42,0.45)" stroke="rgba(245,158,11,0.3)" />
          <text x="74" y="48" fill="#94a3b8" fontSize="4">ورشة</text>
          <motion.path
            d="M 20 30 Q 50 25 70 45"
            fill="none"
            stroke="rgba(14,165,233,0.5)"
            strokeWidth="0.6"
            strokeDasharray="2 2"
            animate={{ strokeDashoffset: [0, -10] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
          />
          {nodes.map((n, i) => (
            <g key={i}>
              <circle
                cx={n.vx}
                cy={n.vy}
                r={n.s === "active" ? 3.5 : 2.8}
                fill={n.s === "maintenance" ? "#f59e0b" : n.s === "emergency" ? "#ef4444" : n.s === "idle" ? "#64748b" : "#22c55e"}
                opacity={0.9}
              />
              <text x={n.vx} y={n.vy + 7} textAnchor="middle" fill="#cbd5f5" fontSize="3">
                {n.plate.replace(/\D/g, "").slice(-2)}
              </text>
            </g>
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> نشط
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-slate-500" /> خامل
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> صيانة
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> طوارئ
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function FuelCenter({
  fuelTrend,
  dailyFuelLiters,
  fuelCostDaily,
  rankings,
  dashboard
}: {
  fuelTrend: Array<{ d: string; liters: number; cost: number }>;
  dailyFuelLiters: number;
  fuelCostDaily: number;
  rankings: Array<{ plate: string; eff: number; score: number }>;
  dashboard: LiveDashboard;
}) {
  return (
    <Card className="erp-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Fuel className="h-5 w-5 text-sky-500" />
          إدارة الوقود والكفاءة
        </CardTitle>
        <p className="text-xs text-muted-foreground">مرتبط بحجم نشاط المصنع اليوم (~{dashboard.kpis.producedPiecesToday.toLocaleString("ar")} قطعة).</p>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="h-56">
          <p className="mb-2 text-[10px] text-muted-foreground">اتجاه لترات اليوم وتكلفة</p>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={fuelTrend}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="d" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="l" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Area yAxisId="l" type="monotone" dataKey="liters" name="لتر" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" />
              <Line yAxisId="r" type="monotone" dataKey="cost" name="ر.س" stroke="#f97316" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div>
          <div className="mb-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-center dark:bg-muted/15">
              <p className="text-[10px] text-muted-foreground">اليوم</p>
              <p className="text-xl font-bold text-primary">{dailyFuelLiters.toLocaleString("ar")} ل</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-center dark:bg-muted/15">
              <p className="text-[10px] text-muted-foreground">تكلفة يومية</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{fuelCostDaily.toLocaleString("ar")} ر.س</p>
            </div>
          </div>
          <p className="mb-2 text-xs font-semibold">ترتيب الاستهلاك (محاكاة)</p>
          <ul className="space-y-2 text-xs">
            {rankings.map((r) => (
              <li key={r.plate} className="flex justify-between rounded-lg border border-border px-2 py-1.5">
                <span className="font-mono">{r.plate}</span>
                <span className="text-muted-foreground">مؤشر {r.score}</span>
                <span className="text-emerald-600 dark:text-emerald-400">{r.eff} كم/ل</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] dark:bg-amber-950/20">
            <p className="font-semibold text-amber-800 dark:text-amber-200">تنبيهات وقود ذكية</p>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              <li>استهلاك مرتفع على مركبة توصيل — مراجعة خمول المحرك.</li>
              <li>اشتباه تسرّب — مقارنة بقراءات آخر تعبئة.</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MaintenanceCenter({
  vehicles,
  maintCostTrend,
  preventive
}: {
  vehicles: FleetVehicle[];
  maintCostTrend: Array<{ d: string; liters: number; cost: number; maint: number }>;
  preventive: Array<{ plate: string; nextOilKm: number; filterKm: number; tireDays: number; urgent: boolean; inspect: string }>;
}) {
  const svc = ["تغيير زيت", "فلتر هواء", "فلتر وقود", "زيت هيدروليك", "استبدال إطارات", "فرامل", "بطارية", "كشف دوري"];
  const historyCount = vehicles.length * 4;
  const schedCount = vehicles.filter((v) => v.maintHealth < 80).length;
  const downtimeH = vehicles.reduce((s, v) => s + (v.status === "maintenance" ? 18 : 6), 0);
  return (
    <Card className="erp-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wrench className="h-5 w-5 text-primary" />
          مركز صيانة الأسطول والوقائي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={maintCostTrend}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="d" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="maint" name="تكلفة صيانة ر.س" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["جداول قادمة", `${schedCount}+`],
            ["سجل هذا الشهر", String(historyCount)],
            ["زمن تعطل تقديري", `${downtimeH} ساعات`]
          ].map(([a, b]) => (
            <div key={String(a)} className="rounded-xl border border-border bg-muted/25 p-3 text-center dark:bg-muted/15">
              <p className="text-[10px] text-muted-foreground">{a}</p>
              <p className="text-lg font-bold">{b}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold">صيانة وقائية — المسافات والزمن المتبقي</p>
          <div className="max-h-48 space-y-2 overflow-y-auto text-xs">
            {preventive.map((p) => (
              <div
                key={p.plate}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-2 py-2 ${p.urgent ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"}`}
              >
                <span className="font-mono font-bold">{p.plate}</span>
                <span>زيت: {p.nextOilKm} كم</span>
                <span>فلتر: {p.filterKm} كم</span>
                <span>إطارات: {p.tireDays} يوم</span>
                <span className="text-muted-foreground">كشف: {p.inspect}</span>
                {p.urgent ? <Badge variant="destructive">عاجل</Badge> : <Badge variant="secondary">راقب</Badge>}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-muted-foreground">يشمل جميع أنواع البنود المذكورة: زيت، فلاتر، هيدروليك، إطارات، فرامل، بطاريات، فحص دوري.</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {svc.map((x) => (
              <Badge key={x} variant="outline" className="text-[9px]">
                {x}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DriverPerformance({
  drivers
}: {
  drivers: Array<{ name: string; eff: number; viol: number; licDays: number; trips: number }>;
}) {
  return (
    <Card className="erp-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="h-5 w-5 text-primary" />
          إدارة السائقين والأداء
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        {drivers.map((d) => (
          <div key={d.name} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2 dark:bg-muted/10">
            <span className="font-semibold">{d.name}</span>
            <span className="text-emerald-600 dark:text-emerald-400">كفاءة وقود {d.eff.toFixed(1)}</span>
            <span className={d.viol > 1 ? "text-destructive" : "text-muted-foreground"}>مخالفات {d.viol}</span>
            <span className="text-muted-foreground">حوادث: 0</span>
            <span className="font-mono">رخصة: {d.licDays} يوم</span>
            <Badge variant="outline">{d.trips} رحلات</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function OperationsTasks({
  trips
}: {
  trips: Array<{ id: string; route: string; v: string; state: string; delay: number }>;
}) {
  return (
    <Card className="erp-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <RouteIcon className="h-5 w-5 text-primary" />
          مهام الأسطول والرحلات
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-right text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="p-2">المهمة</th>
                <th className="p-2">مركبة</th>
                <th className="p-2">الحالة</th>
                <th className="p-2">تأخير</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => (
                <tr key={t.id} className="border-b border-border/60">
                  <td className="p-2">{t.route}</td>
                  <td className="p-2 font-mono">{t.v}</td>
                  <td className="p-2">
                    <Badge variant={t.state === "delayed" ? "destructive" : t.state === "active" ? "default" : "secondary"}>
                      {t.state === "active" ? "نشطة" : t.state === "completed" ? "مكتملة" : "متأخرة"}
                    </Badge>
                  </td>
                  <td className="p-2">{t.delay ? `${t.delay} د` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[11px] text-muted-foreground">استخدام مركبات: نشطة {trips.filter((t) => t.state === "active").length} / إجمالي المهام {trips.length}</p>
      </CardContent>
    </Card>
  );
}

function InventoryBridge({
  spareStock,
  dashboard
}: {
  spareStock: Array<{ item: string; qty: number; min: number; crit: boolean }>;
  dashboard: LiveDashboard;
}) {
  return (
    <Card className="erp-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Boxes className="h-5 w-5 text-primary" />
          تكامل قطع الغيار والمخزون
        </CardTitle>
        <p className="text-xs text-muted-foreground">مرتبط بمؤشر المخزون العام: {dashboard.kpis.lowStockItems} بنود منخفضة.</p>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {spareStock.map((s) => (
          <div
            key={s.item}
            className={`rounded-xl border p-3 text-xs ${s.crit || s.qty < s.min ? "border-destructive/40 bg-destructive/5" : "border-border bg-muted/25 dark:bg-muted/10"}`}
          >
            <p className="font-medium">{s.item}</p>
            <p className="mt-1 text-muted-foreground">
              متوفر: {s.qty} · حد أدنى: {s.min}
            </p>
            {s.qty < s.min ? <Badge variant="destructive" className="mt-2">ناقص حرجة</Badge> : <Badge variant="secondary" className="mt-2">متوازن</Badge>}
          </div>
        ))}
        <Button variant="outline" className="h-full min-h-[88px]" asChild>
          <Link href={"/ar/inventory" as Route}>فتح المستودع الذكي</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function AccountingCharts({
  fleetOpCost,
  fuelCostDaily,
  utilizationSeries,
  maintenance
}: {
  fleetOpCost: number;
  fuelCostDaily: number;
  utilizationSeries: Array<{ name: string; util: number; idx: number }>;
  maintenance: number;
}) {
  const costBreak = [
    { cat: "وقود", v: fuelCostDaily },
    { cat: "صيانة", v: Math.round(fleetOpCost * 0.38) },
    { cat: "تأمين/تعميد", v: Math.round(fleetOpCost * 0.12) },
    { cat: "أخرى", v: Math.round(fleetOpCost * 0.15) }
  ];
  const cpm = Math.round((fleetOpCost / Math.max(1, 4500)) * 100) / 100;
  return (
    <Card className="erp-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5 text-primary" />
          محاسبة الأسطول وتحليل التكلفة
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          تكلفة تقريبية لكل كم: {cpm} ر.س · مركبات صيانة: {maintenance}
        </p>
      </CardHeader>
      <CardContent className="grid gap-8 lg:grid-cols-2">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costBreak}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="cat" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="v" name="ر.س" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={utilizationSeries}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-25} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="util" name="استخدام %" stroke="hsl(var(--primary))" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function ComplianceDocs({ vehicles }: { vehicles: FleetVehicle[] }) {
  const expSoon = vehicles.filter((v) => v.regExpiryDays < 60 || !v.insuranceOk);
  const insOk = vehicles.filter((v) => v.insuranceOk).length;
  const insLine = `${insOk} من ${vehicles.length} ساري`;
  const regLine = `${expSoon.length} تحتاج متابعة`;
  return (
    <Card className="erp-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BadgeCheck className="h-5 w-5 text-primary" />
          مستندات وامتثال
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {[
          ["تأمين الأسطول", insLine],
          ["تعميد مركبات", regLine],
          ["رخص السائقين", "مزامنة مع الموارد البشرية"],
          ["شهادات فحص سلامة", "مجدولة ربع سنوي"],
          ["امتثال نقل مواد خطرة", "غير مفعّل — مركبات عامة فقط"]
        ].map(([a, b]) => (
          <div key={String(a)} className="flex items-center justify-between rounded-xl border border-border bg-muted/25 px-3 py-2 text-sm dark:bg-muted/10">
            <span>{a}</span>
            <span className="text-xs font-medium text-primary">{b}</span>
          </div>
        ))}
        <div className="md:col-span-2 rounded-xl border border-dashed border-amber-500/35 bg-amber-500/5 p-3 text-xs text-muted-foreground dark:bg-amber-950/15">
          <FileWarning className="ml-2 inline h-4 w-4 text-amber-500" />
          تنبيهات انتهاء: مركبات بانتهاء تعميد خلال 60 يوم تظهر في لوحة المخاطر تلقائياً.
        </div>
      </CardContent>
    </Card>
  );
}

function AiInsights({
  alerts
}: {
  alerts: Array<{ level: "crit" | "warn" | "info"; text: string }>;
}) {
  return (
    <Card className="erp-card border-violet-500/25 bg-gradient-to-br from-card to-violet-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-5 w-5 text-violet-500" />
          رؤى ذكية وتنبيهات تشغيلية
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {alerts.map((a, i) => (
          <div
            key={i}
            className={`rounded-xl border px-3 py-2 text-xs ${
              a.level === "crit"
                ? "border-destructive/40 bg-destructive/10"
                : a.level === "warn"
                  ? "border-amber-500/35 bg-amber-500/10"
                  : "border-border bg-muted/40"
            }`}
          >
            <span className="font-semibold text-[10px] uppercase tracking-wide">{a.level}</span>
            <p className="mt-1 leading-relaxed">{a.text}</p>
          </div>
        ))}
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs dark:bg-primary/10">
          <p className="font-semibold text-primary">مزيد من الأمثلة</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
            <li>خطر ارتفاع حرارة مجموعة الدوران — تقييم تبريد.</li>
            <li>تجاوز فاصل تغيير زيت — ربط بجدول الوقائي.</li>
            <li>تآكل إطارات غير متماثل — محاذاة مقترحة.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceFooter({
  vehicles,
  fuelTrend
}: {
  vehicles: FleetVehicle[];
  fuelTrend: Array<{ d: string; liters: number; cost: number }>;
}) {
  const uptime = Math.round(
    (vehicles.filter((v) => v.status !== "maintenance" && v.status !== "out_of_service").length / Math.max(1, vehicles.length)) * 100
  );
  const eff = fuelTrend.reduce((s, x) => s + x.liters, 0) / Math.max(1, fuelTrend.length);
  return (
    <Card className="erp-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">تحليلات الأداء الشاملة</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["جاهزية الأسطول", `${uptime}%`],
          ["متوسط لتر/يوم", `${Math.round(eff)}`],
          ["أداء لوجستي", "جيد +"],
          ["اتجاه الصيانة", "مستقر"]
        ].map(([k, v]) => (
          <div key={String(k)} className="rounded-xl border border-border bg-muted/30 p-4 text-center dark:bg-muted/15">
            <p className="text-[10px] text-muted-foreground">{k}</p>
            <p className="mt-1 text-xl font-bold text-primary">{v}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SideAlerts({
  dashboard,
  vehicles,
  dailyFuelLiters
}: {
  dashboard: LiveDashboard;
  vehicles: FleetVehicle[];
  dailyFuelLiters: number;
}) {
  const emergencyV = vehicles.filter((v) => v.status === "emergency").length;
  const fuelWarn = dailyFuelLiters > 400;
  const fuelHigh = dailyFuelLiters > 350;
  const items = [
    ...dashboard.alerts.map((a) => ({
      tag: "مصنع",
      msg: a.message,
      tone: a.severity === "critical" ? ("crit" as const) : a.severity === "warning" ? ("warn" as const) : ("info" as const)
    })),
    {
      tag: "وقود",
      msg: fuelHigh ? `استهلاك يومي مرتفع: ${dailyFuelLiters} ل` : "استهلاك ضمن النطاق المتوقع",
      tone: fuelWarn ? ("warn" as const) : ("info" as const)
    },
    {
      tag: "أسطول",
      msg: emergencyV > 0 ? "مهمة طوارئ مفعّلة على مركبة" : "لا أحداث طوارئ مفتوحة",
      tone: emergencyV > 0 ? ("warn" as const) : ("info" as const)
    }
  ];
  return (
    <Card className="erp-card sticky top-4 border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          بث تنبيهات الأسطول
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((it, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`rounded-xl border px-3 py-2 text-xs leading-relaxed ${
              it.tone === "crit"
                ? "border-destructive/40 bg-destructive/10"
                : it.tone === "warn"
                  ? "border-amber-500/35 bg-amber-500/10"
                  : "border-border bg-muted/30"
            }`}
          >
            <Badge variant="outline" className="mb-1 text-[9px]">
              {it.tag}
            </Badge>
            <p>{it.msg}</p>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

function FleetHeatSummary({ vehicles }: { vehicles: FleetVehicle[] }) {
  const byLoc = [...new Set(vehicles.map((v) => v.location))].map((loc) => ({
    loc,
    intensity: vehicles.filter((v) => v.location === loc && v.status === "active").length,
    idle: vehicles.filter((v) => v.location === loc && v.status === "idle").length
  }));
  const max = Math.max(...byLoc.map((x) => x.intensity + x.idle), 1);
  return (
    <Card className="erp-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">heatmap نشاط المواقع</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {byLoc.map((r) => (
          <div key={r.loc}>
            <div className="mb-1 flex justify-between text-[11px]">
              <span>{r.loc}</span>
              <span className="text-muted-foreground">
                نشط {r.intensity} · خامل {r.idle}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-l from-primary to-emerald-500"
                style={{ width: `${Math.min(100, ((r.intensity + r.idle) / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
