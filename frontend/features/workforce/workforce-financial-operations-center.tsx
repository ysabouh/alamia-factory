"use client";

import type React from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Banknote,
  Bell,
  Building2,
  CalendarClock,
  ClipboardCheck,
  Coins,
  Factory,
  Gauge,
  HandCoins,
  HardHat,
  LineChart,
  PiggyBank,
  Scale,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  Wallet,
  Zap
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart as ReLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,

} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LiveDashboard, MachineSnapshot } from "@/types/factory";

import { SmartLeaveVacationModule } from "./smart-leave-vacation-module";
import type { Attendance, OpsEmployee } from "./workforce-models";

export type { OpsEmployee } from "./workforce-models";

type Severity = "low" | "medium" | "high" | "critical";

const DEPTS = [
  { key: "prod", name: "الإنتاج", icon: Factory },
  { key: "maint", name: "الصيانة", icon: Activity },
  { key: "wh", name: "المستودعات", icon: Truck },
  { key: "qa", name: "الجودة", icon: ShieldCheck },
  { key: "acc", name: "المحاسبة", icon: Banknote }
] as const;

function seedFromStr(s: string, max: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % max;
}

function hallFromMachine(m: MachineSnapshot): string {
  if (m.type === "injection") return "قاعة الحقن";
  if (m.type === "blow_molding") return "قاعة النفخ";
  return "التغليف";
}

function buildEmployees(dashboard: LiveDashboard): OpsEmployee[] {
  const { machines, kpis } = dashboard;
  const rows: OpsEmployee[] = [];
  const seen = new Set<string>();

  const push = (name: string, role: string, dept: string, m: MachineSnapshot | null, kind: "op" | "tech") => {
    if (!name || seen.has(name)) return;
    seen.add(name);
    const id = `e-${name}`;
    const effBase = kind === "op" ? 78 + seedFromStr(name, 18) : 72 + seedFromStr(name + "t", 20);
    const wasteAdj = kpis.wasteRate > 4 ? -4 : 2;
    rows.push({
      id,
      name,
      initials: name
        .split(/\s/)
        .map((x) => x[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || name.slice(0, 2),
      role,
      department: dept,
      hall: m ? hallFromMachine(m) : dept === "الصيانة" ? "جميع القاعات" : "إداري",
      shift: seedFromStr(name, 2) === 0 ? "صباحي" : seedFromStr(name, 2) === 1 ? "مسائي" : "ليلي",
      attendance: (["present", "present", "present", "late", "leave", "absent"] as Attendance[])[seedFromStr(name, 6)],
      performance: Math.min(99, effBase + seedFromStr(name + "p", 12)),
      reliability: Math.min(100, 80 + seedFromStr(name + "r", 18)),
      productionEff: Math.min(98, effBase + wasteAdj),
      bonusPoints: 200 + seedFromStr(name + "b", 400),
      violations: seedFromStr(name + "v", 4),
      machineCode: m && kind === "op" ? m.code : kind === "tech" && m ? m.code : null,
      avatarHue: seedFromStr(name, 360)
    });
  };

  machines.forEach((m) => {
    if (m.operator) push(m.operator, "مشغّل ماكينة", "الإنتاج", m, "op");
    if (m.technician) push(m.technician, "فني صيانة", "الصيانة", m, "tech");
  });

  const extra: Array<[string, string, string]> = [
    ["ليلى المالكي", "مشرفة جودة", "الجودة"],
    ["ناصر الزهراني", "أمين مستودع", "المستودعات"],
    ["هند الغامدي", "محاسبة تكاليف", "المحاسبة"],
    ["رامي العتيبي", "مخطط إنتاج", "الإنتاج"],
    ["منى الشهري", "مراقبة سلامة", "الإنتاج"],
    ["خالد باحميد", "مشغّل خط", "الإنتاج"]
  ];
  extra.forEach(([n, r, d]) => {
    const m = machines[seedFromStr(n, machines.length)] ?? null;
    push(n, r, d, m, "op");
  });

  return rows.sort((a, b) => b.performance - a.performance);
}

function financeModel(dashboard: LiveDashboard) {
  const k = dashboard.kpis;
  const produced = k.producedPiecesToday;
  const revenueToday = Math.round(produced * 2.15 + seedFromStr("rev", 8000));
  const materialCost = Math.round(produced * 0.62 + k.producedWeightKgToday * 4.2);
  const energyCost = Math.round(4200 + k.machineUtilization * 38);
  const maintCost = Math.round(1800 + k.openMaintenanceTickets * 650);
  const wasteCost = Math.round(k.producedWeightKgToday * (k.wasteRate / 100) * 12);
  const laborDaily = Math.round(12400 + produced * 0.08);
  const payrollMonth = Math.round(laborDaily * 26 * 1.08);
  const logistics = Math.round(2100 + seedFromStr("log", 400));
  const opex = materialCost + energyCost + maintCost + laborDaily + logistics + wasteCost;
  const netProfit = revenueToday - opex;
  const margin = revenueToday ? Math.round((netProfit / revenueToday) * 1000) / 10 : 0;
  const health = Math.max(
    32,
    Math.min(
      98,
      Math.round(margin * 1.4 + (100 - k.wasteRate) * 0.25 + k.machineUtilization * 0.35 - k.openMaintenanceTickets * 3)
    )
  );
  return {
    revenueToday,
    materialCost,
    energyCost,
    maintCost,
    wasteCost,
    laborDaily,
    payrollMonth,
    logistics,
    opex,
    netProfit,
    margin,
    health
  };
}

const violationCatalog: Array<{ type: string; sev: Severity; action: string }> = [
  { type: "تأخر متكرر — الوردية الصباحية", sev: "medium", action: "تحذير + خصم جزئي" },
  { type: "توقف ماكينة غير مصرّح", sev: "high", action: "إيقاف مؤقت من التشغيل" },
  { type: "مخالفة معدات وقاية", sev: "low", action: "تنبيه سلامة" },
  { type: "هدر إنتاج فوق العتبة", sev: "medium", action: "تخفيض مكافأة أداء" },
  { type: "غياب دون إذن", sev: "high", action: "خصم يوم + إنذار" }
];

type Props = { dashboard: LiveDashboard };

export function WorkforceFinancialOperationsCenter({ dashboard }: Props) {
  const [deptFilter, setDeptFilter] = useState<string | "all">("all");
  const [attFilter, setAttFilter] = useState<Attendance | "all">("all");

  const employees = useMemo(() => buildEmployees(dashboard), [dashboard]);
  const fin = useMemo(() => financeModel(dashboard), [dashboard]);

  const presentN = employees.filter((e) => e.attendance === "present").length;
  const absentN = employees.filter((e) => e.attendance === "absent").length;
  const lateN = employees.filter((e) => e.attendance === "late").length;
  const activeN = employees.length;
  const shiftCoverage = Math.round((presentN / Math.max(1, activeN)) * 100);

  const filtered = employees.filter((e) => {
    if (deptFilter !== "all" && e.department !== deptFilter) return false;
    if (attFilter !== "all" && e.attendance !== attFilter) return false;
    return true;
  });

  const teamStats = DEPTS.map((d) => {
    const ms = employees.filter((e) => e.department === d.name);
    const perf = ms.length ? Math.round(ms.reduce((s, e) => s + e.performance, 0) / ms.length) : 0;
    return {
      ...d,
      headcount: ms.length,
      perf,
      shifts: ms.length ? Math.ceil(ms.length / 4) : 0
    };
  });

  const payrollPreview = employees.map((e) => {
    const base = 4200 + seedFromStr(e.id, 2800);
    const ot = seedFromStr(e.id + "ot", 800);
    const prodBonus = Math.round(e.productionEff * 12);
    const perfBonus = Math.round(e.performance * 8);
    const attBonus = e.attendance === "present" ? 220 : e.attendance === "late" ? 80 : 0;
    const penalties = e.violations * 90 + (e.attendance === "absent" ? 400 : 0);
    const wasteDed = Math.round(dashboard.kpis.wasteRate * seedFromStr(e.id + "w", 40));
    const net = base + ot + prodBonus + perfBonus + attBonus - penalties - wasteDed;
    return {
      id: e.id,
      name: e.name,
      base,
      ot,
      prodBonus,
      perfBonus,
      attBonus,
      penalties,
      wasteDed,
      net
    };
  });

  const monthlyPayrollEst = payrollPreview.reduce((s, r) => s + r.net, 0);

  const trendAtt = dashboard.productionTrend.map((p, i) => ({
    ...p,
    presentPct: Math.min(100, 86 + seedFromStr(`a${i}`, 12) + i),
    prodIdx: Math.round(p.produced / 180)
  }));

  const overtimeBars = ["الحقن", "النفخ", "التغليف", "المستودع", "الصيانة"].map((hall, i) => ({
    hall,
    hours: Math.round(12 + seedFromStr(hall, 48) + i * 6)
  }));

  const cashflowForecast = [
    { m: "الحالي", in: fin.revenueToday * 26, out: fin.opex * 26 },
    { m: "+1", in: Math.round(fin.revenueToday * 26 * 1.03), out: Math.round(fin.opex * 26 * 1.02) },
    { m: "+2", in: Math.round(fin.revenueToday * 26 * 1.04), out: Math.round(fin.opex * 26 * 1.035) },
    { m: "+3", in: Math.round(fin.revenueToday * 26 * 1.05), out: Math.round(fin.opex * 26 * 1.05) }
  ];

  const heatSlots = Array.from({ length: 21 }, (_, i) => ({
    i,
    v: seedFromStr(`h${i}`, 100),
    label: `${6 + Math.floor(i / 3)}:${String((i % 3) * 20).padStart(2, "0")}`
  }));

  const achievements = [
    { badge: "حضور مثالي", pts: 100, hue: "from-emerald-500/80 to-teal-600/80" },
    { badge: "كفاءة إنتاج عالية", pts: 150, hue: "from-sky-500/80 to-blue-700/80" },
    { badge: "صفر عيوب", pts: 50, hue: "from-violet-500/80 to-purple-700/80" },
    { badge: "امتثال سلامة", pts: 75, hue: "from-amber-500/80 to-orange-700/80" }
  ];

  const top3 = [...employees].sort((a, b) => b.bonusPoints - a.bonusPoints).slice(0, 5);

  const alerts = [
    ...dashboard.alerts.map((a) => ({
      tag: "تشغيل",
      msg: a.message,
      tone: a.severity === "critical" ? "crit" : a.severity === "warning" ? "warn" : "info"
    })),
    { tag: "رواتب", msg: `تقدير اليوم التشغيلي لليد العاملة: ${fin.laborDaily.toLocaleString("ar")} ر.س`, tone: "info" },
    {
      tag: "مالية",
      msg: absentN > 1 ? `${absentN} غياب — مراجعة تغطية الورديات` : "التغطية ضمن الهدف",
      tone: absentN > 1 ? "warn" : "info"
    },
    { tag: "تكلفة", msg: `هدر خام مرتبط بتكلفة تقديرية ${fin.wasteCost.toLocaleString("ar")} ر.س اليوم`, tone: "warn" },
    {
      tag: "إجازات",
      msg:
        employees.filter((e) => e.attendance === "leave").length > 0
          ? `${employees.filter((e) => e.attendance === "leave").length} موظف على إجازة — راقب تغطية قاعات الإنتاج`
          : "لا إجازات تتعارض مع الحد الأدنى للتغطية الآن",
      tone: employees.filter((e) => e.attendance === "leave").length > 2 ? "warn" : "info"
    }
  ];

  const purchaseRows = [
    { sup: "بتروكيم — PP", pending: "42,180", perf: "ممتاز" },
    { sup: "الخليج للمحارم LDPE", pending: "18,920", perf: "جيد" },
    { sup: "سبائك ألوان", pending: "6,340", perf: "ممتاز" }
  ];

  const salesRows = [
    { cust: "مياه الواحة", out: "28,900", prog: "+12%" },
    { cust: "تعبئة الأصيل", out: "15,200", prog: "+8%" },
    { cust: "منتجات نورا", out: "9,640", prog: "+5%" }
  ];

  return (
    <main className="min-h-screen bg-background p-4 text-foreground md:p-6">
      <div className="mx-auto max-w-[1920px] space-y-6" dir="rtl">
        <motion.header
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="erp-card relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-4 md:p-6"
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,hsl(var(--primary)/0.07),transparent_45%)]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-[10px] tracking-[0.32em] text-primary/90">HR · PAYROLL · FINANCE · OPS</p>
                <h1 className="mt-1 text-2xl font-bold md:text-3xl">مركز العمليات: القوى العاملة والمالية</h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  ذكاء تشغيلي موحّد يربط الإنتاج، الصيانة، المخزون، والأداء المالي — ليس لوحة رواتب تقليدية، بل لوحة تحكّم مصنعية متقدمة.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={"/ar/monitoring" as Route}>ربط مراقبة MES</Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link href={"/ar/production" as Route}>أوامر الإنتاج</Link>
              </Button>
            </div>
          </div>

          <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5">
            <Kpi icon={Users} label="إجمالي نشط اليوم" value={activeN.toString()} sub="في السجل التشغيلي" accent="text-primary" />
            <Kpi icon={UserCheck} label="حاضر الآن" value={presentN.toString()} sub={`متأخر: ${lateN}`} accent="text-emerald-600 dark:text-emerald-400" />
            <Kpi icon={CalendarClock} label="غياب" value={absentN.toString()} sub="يحتاج تغطية" accent="text-destructive" />
            <Kpi icon={Gauge} label="تغطية ورديات" value={`${shiftCoverage}%`} sub="هدف مصنعي ذكي" accent="text-sky-600 dark:text-sky-400" />
            <Kpi icon={HandCoins} label="تكلفة يد يومية" value={`${fin.laborDaily.toLocaleString("ar")}`} sub="ر.س تقدير" accent="text-amber-600 dark:text-amber-400" />
            <Kpi icon={Wallet} label="مسير شهري (تقدير)" value={`${monthlyPayrollEst.toLocaleString("ar")}`} sub={`ثابت: ${fin.payrollMonth.toLocaleString("ar")}`} accent="text-violet-600 dark:text-violet-400" />
            <Kpi icon={PiggyBank} label="ربحية تقريبية اليوم" value={`${fin.netProfit.toLocaleString("ar")}`} sub="إيراد − مصروف تشغيل" accent="text-emerald-600 dark:text-emerald-400" />
            <Kpi icon={Coins} label="إيرادات اليوم" value={`${fin.revenueToday.toLocaleString("ar")}`} sub="محاكاة مرتبطة بالإنتاج" accent="text-primary" />
            <Kpi icon={Scale} label="مصروفات تشغيل" value={`${fin.opex.toLocaleString("ar")}`} sub="مواد · طاقة · صيانة · نقل" accent="text-orange-600 dark:text-orange-400" />
            <Kpi icon={Activity} label="الصحة المالية" value={`${fin.health}`} suffix="%" sub={`هامش صافي ~${fin.margin}%`} accent="text-cyan-600 dark:text-cyan-400" />
          </div>
        </motion.header>

        <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <OrgHierarchy teamStats={teamStats} openTickets={dashboard.kpis.openMaintenanceTickets} />

            <SmartLeaveVacationModule
              employees={employees}
              dashboard={dashboard}
              fin={{
                laborDaily: fin.laborDaily,
                payrollMonth: fin.payrollMonth,
                wasteRate: dashboard.kpis.wasteRate
              }}
            />

            <Card className="erp-card border-border">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-5 w-5 text-primary" />
                  بطاقات الموظفين الذكية
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <FilterChip active={deptFilter === "all"} onClick={() => setDeptFilter("all")}>
                    الكل
                  </FilterChip>
                  {DEPTS.map((d) => (
                    <FilterChip key={d.key} active={deptFilter === d.name} onClick={() => setDeptFilter(d.name)}>
                      {d.name}
                    </FilterChip>
                  ))}
                  <FilterChip active={attFilter === "all"} onClick={() => setAttFilter("all")}>
                    الحضور: الكل
                  </FilterChip>
                  <FilterChip active={attFilter === "present"} onClick={() => setAttFilter("present")}>
                    حاضر
                  </FilterChip>
                  <FilterChip active={attFilter === "late"} onClick={() => setAttFilter("late")}>
                    متأخر
                  </FilterChip>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((e, i) => (
                      <EmployeeCard key={e.id} emp={e} index={i} />
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <AttendancePanel heatSlots={heatSlots} dashboard={dashboard} />
              <ShiftComparison employees={employees} />
            </div>

            <PayrollEngine payrollPreview={payrollPreview} monthlyTotal={monthlyPayrollEst} />

            <div className="grid gap-6 lg:grid-cols-2">
              <Gamification top3={top3} achievements={achievements} />
              <DisciplineTable />
            </div>

            <PerformanceCharts trendAtt={trendAtt} overtimeBars={overtimeBars} />

            <FinancialOpsBlocks fin={fin} dashboard={dashboard} />

            <div className="grid gap-6 lg:grid-cols-2">
              <IndustrialAccounting dashboard={dashboard} fin={fin} />
              <ExpenseCategories fin={fin} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <PurchaseFinance rows={purchaseRows} />
              <SalesFinance rows={salesRows} fin={fin} />
            </div>

            <CostAnalytics fin={fin} dashboard={dashboard} />

            <CashflowPanel cashflowForecast={cashflowForecast} fin={fin} wasteRate={dashboard.kpis.wasteRate} />

            <SafetyCompliance employees={employees} />
          </div>

          <div className="space-y-6">
            <AlertsStack items={alerts} />
            <LeaderboardSidebar employees={employees} />
          </div>
        </section>
      </div>
    </main>
  );
}

function Kpi({
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
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={`mt-1 text-lg font-bold tabular-nums ${accent}`}>
        {value}
        {suffix ? <span className="mr-1 text-xs font-normal opacity-75">{suffix}</span> : null}
      </p>
      {sub ? <p className="text-[10px] text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function FilterChip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cnChip(active)}
    >
      {children}
    </button>
  );
}

function cnChip(active: boolean) {
  return `rounded-full border px-3 py-1 text-xs transition ${active ? "border-primary bg-primary/15 text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted/50"}`;
}

function OrgHierarchy({
  teamStats,
  openTickets
}: {
  teamStats: Array<{ key: string; name: string; icon: React.ComponentType<{ className?: string }>; headcount: number; perf: number; shifts: number }>;
  openTickets: number;
}) {
  return (
    <Card className="erp-card overflow-hidden border-border">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-5 w-5 text-primary" />
          الهيكل التنظيمي والفرق النشطة
        </CardTitle>
        <p className="text-xs text-muted-foreground">مسؤولون · مشغّلون · فرق صيانة ومستودع · محاسبة · جودة — مع تخصيص قوى عمل حي.</p>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-6 flex flex-col items-center">
          <div className="rounded-2xl border border-primary/30 bg-primary/10 px-6 py-3 text-center shadow-sm">
            <p className="text-[10px] text-primary">الإدارة التشغيلية</p>
            <p className="font-bold">مدير المصنع الذكي</p>
          </div>
          <div className="my-2 h-6 w-px bg-border" />
          <div className="grid w-full max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {teamStats.map((t) => {
              const Icon = t.icon;
              return (
                <motion.div
                  key={t.key}
                  whileHover={{ y: -3 }}
                  className="rounded-xl border border-border bg-card p-3 text-center"
                >
                  <Icon className="mx-auto mb-2 h-6 w-6 text-primary" />
                  <p className="text-xs font-semibold">{t.name}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">الرأس · {t.headcount}</p>
                  <p className="text-[11px]">أداء {t.perf}%</p>
                  <p className="text-[10px] text-muted-foreground">ورديات نشطة · {t.shifts}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
        <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/30 p-2">
            <span className="font-semibold text-foreground">مشرفو الإنتاج</span> · مرتبطون بخطط MES وقاعات الحقن/النفخ.
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-2">
            <span className="font-semibold text-foreground">فرق الصيانة</span> · تذاكر مفتوحة: {openTickets}
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-2">
            <span className="font-semibold text-foreground">المستودع والجودة</span> · تزامن مع مخاطر المخزون والعيوب.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function attBadge(att: OpsEmployee["attendance"]) {
  const map = {
    present: { label: "حاضر", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
    late: { label: "متأخر", className: "bg-amber-500/15 text-amber-800 dark:text-amber-200" },
    absent: { label: "غائب", className: "bg-destructive/15 text-destructive" },
    leave: { label: "إجازة", className: "bg-sky-500/15 text-sky-800 dark:text-sky-200" }
  };
  const m = map[att];
  return <Badge className={m.className}>{m.label}</Badge>;
}

function EmployeeCard({ emp, index }: { emp: OpsEmployee; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: index * 0.03 }}
      className="erp-card flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-inner"
          style={{
            background: `linear-gradient(135deg, hsl(${emp.avatarHue} 70% 45%), hsl(${(emp.avatarHue + 40) % 360} 65% 35%))`
          }}
        >
          {emp.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{emp.name}</p>
          <p className="text-[11px] text-muted-foreground">{emp.role}</p>
          <div className="mt-2 flex flex-wrap gap-1">{attBadge(emp.attendance)}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <p className="text-muted-foreground">القسم</p>
          <p className="font-medium">{emp.department}</p>
        </div>
        <div>
          <p className="text-muted-foreground">القاعة</p>
          <p className="font-medium">{emp.hall}</p>
        </div>
        <div>
          <p className="text-muted-foreground">الوردية</p>
          <p className="font-medium">{emp.shift}</p>
        </div>
        <div>
          <p className="text-muted-foreground">الماكينة</p>
          <p className="font-mono font-medium">{emp.machineCode ?? "—"}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center text-[10px]">
        <div>
          <p className="text-muted-foreground">أداء</p>
          <p className="text-base font-bold text-primary">{emp.performance}</p>
        </div>
        <div>
          <p className="text-muted-foreground">موثوقية</p>
          <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{emp.reliability}</p>
        </div>
        <div>
          <p className="text-muted-foreground">إنتاجية</p>
          <p className="text-base font-bold text-violet-600 dark:text-violet-400">{emp.productionEff}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-amber-600 dark:text-amber-400">نقاط: {emp.bonusPoints}</span>
        <span className={emp.violations > 0 ? "text-destructive" : "text-muted-foreground"}>
          مخالفات: {emp.violations}
        </span>
      </div>
    </motion.div>
  );
}

function AttendancePanel({
  heatSlots,
  dashboard
}: {
  heatSlots: Array<{ i: number; v: number; label: string }>;
  dashboard: LiveDashboard;
}) {
  return (
    <Card className="erp-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-5 w-5 text-primary" />
          الحضور والورديات (ذكاء لحظي)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          تسجيل دخول/خروج · تأخير · غياب · نقص تغطية — مرتبط بإنتاج اليوم ({dashboard.kpis.producedPiecesToday.toLocaleString("ar")}{" "}
          قطعة).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["تبديل ورديات", "3 طلب"],
            ["تأخر اليوم", "دقائق 42"],
            ["إضافي معتمد", "س 18"],
            ["نقص تغطية", "خط النفخ"]
          ].map(([a, b]) => (
            <div key={a} className="rounded-xl border border-border bg-muted/30 p-3 text-center dark:bg-muted/15">
              <p className="text-[10px] text-muted-foreground">{a}</p>
              <p className="mt-1 text-sm font-semibold">{b}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="mb-2 text-[11px] text-muted-foreground">خريطة حرارة حضور أسبوعية (محاكاة)</p>
          <div className="grid grid-cols-7 gap-1">
            {heatSlots.map((s) => (
              <div
                key={s.i}
                title={s.label}
                className="aspect-square rounded-md border border-border/60"
                style={{
                  background: `color-mix(in srgb, hsl(var(--primary)) ${s.v}%, hsl(var(--muted)) ${100 - s.v}%)`
                }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ShiftComparison({ employees }: { employees: OpsEmployee[] }) {
  const byShift = ["صباحي", "مسائي", "ليلي"].map((sh) => {
    const g = employees.filter((e) => e.shift === sh);
    const eff = g.length ? Math.round(g.reduce((s, e) => s + e.productionEff, 0) / g.length) : 0;
    return { shift: sh, eff, n: g.length };
  });
  return (
    <Card className="erp-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer className="h-5 w-5 text-primary" />
          مقارنة أداء الورديات
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byShift}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="shift" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px"
                }}
              />
              <Bar dataKey="eff" name="كفاءة %" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
          {byShift.map((r) => (
            <li key={r.shift}>
              {r.shift}: {r.n} موظف · كفاءة مركّبة {r.eff}%
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function PayrollEngine({
  payrollPreview,
  monthlyTotal
}: {
  payrollPreview: Array<{
    id: string;
    name: string;
    base: number;
    ot: number;
    prodBonus: number;
    perfBonus: number;
    attBonus: number;
    penalties: number;
    wasteDed: number;
    net: number;
  }>;
  monthlyTotal: number;
}) {
  const sample = payrollPreview.slice(0, 4);
  return (
    <Card className="erp-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-5 w-5 text-primary" />
          محرك الرواتب الذكي — تقدير مباشر
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          أساس + إضافي + مكافآت إنتاج/أداء/حضور − عقوبات − غياب − ربط هدر تشغيلي.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 dark:bg-primary/10">
          <p className="text-sm font-semibold">صافي المسير التقديري (الشاشة)</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-primary">{monthlyTotal.toLocaleString("ar")} ر.س</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-right text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="p-2">الموظف</th>
                <th className="p-2">أساس</th>
                <th className="p-2">إضافي</th>
                <th className="p-2">إنتاج</th>
                <th className="p-2">أداء</th>
                <th className="p-2">حضور</th>
                <th className="p-2">عقوبات</th>
                <th className="p-2">هدر</th>
                <th className="p-2 font-semibold text-foreground">صافي</th>
              </tr>
            </thead>
            <tbody>
              {sample.map((r) => (
                <tr key={r.id} className="border-b border-border/70">
                  <td className="p-2 font-medium">{r.name}</td>
                  <td className="p-2 tabular-nums">{r.base.toLocaleString("ar")}</td>
                  <td className="p-2 tabular-nums">{r.ot.toLocaleString("ar")}</td>
                  <td className="p-2 tabular-nums text-emerald-600 dark:text-emerald-400">+{r.prodBonus.toLocaleString("ar")}</td>
                  <td className="p-2 tabular-nums text-sky-600 dark:text-sky-400">+{r.perfBonus.toLocaleString("ar")}</td>
                  <td className="p-2 tabular-nums">+{r.attBonus.toLocaleString("ar")}</td>
                  <td className="p-2 tabular-nums text-destructive">−{r.penalties.toLocaleString("ar")}</td>
                  <td className="p-2 tabular-nums text-destructive">−{r.wasteDed.toLocaleString("ar")}</td>
                  <td className="p-2 font-bold tabular-nums">{r.net.toLocaleString("ar")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function Gamification({
  top3,
  achievements
}: {
  top3: OpsEmployee[];
  achievements: Array<{ badge: string; pts: number; hue: string }>;
}) {
  return (
    <Card className="erp-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="h-5 w-5 text-amber-500" />
          التحفيز والألعاب التشغيلية
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {achievements.map((a) => (
            <div
              key={a.badge}
              className={`rounded-xl border border-white/10 bg-gradient-to-br px-3 py-2 text-[11px] text-white shadow-sm ${a.hue}`}
            >
              <p className="font-bold">{a.badge}</p>
              <p className="opacity-90">+{a.pts} نقطة</p>
            </div>
          ))}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">أفضل الأداء (نقاط)</p>
          <div className="space-y-2">
            {top3.map((e, i) => (
              <div key={e.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2 dark:bg-muted/15">
                <span className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-sm">{e.name}</span>
                </span>
                <span className="font-mono text-sm text-amber-600 dark:text-amber-400">{e.bonusPoints}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function sevBadge(sev: Severity) {
  const c =
    sev === "critical"
      ? "bg-destructive/15 text-destructive"
      : sev === "high"
        ? "bg-orange-500/15 text-orange-700 dark:text-orange-300"
        : sev === "medium"
          ? "bg-amber-500/15 text-amber-800 dark:text-amber-200"
          : "bg-muted text-muted-foreground";
  return <Badge className={c}>{sev}</Badge>;
}

function DisciplineTable() {
  return (
    <Card className="erp-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale className="h-5 w-5 text-primary" />
          الانضباط والعقوبات
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="p-2">الحادثة</th>
                <th className="p-2">الخطورة</th>
                <th className="p-2">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {violationCatalog.map((v, i) => (
                <tr key={i} className="border-b border-border/60">
                  <td className="p-2">{v.type}</td>
                  <td className="p-2">{sevBadge(v.sev)}</td>
                  <td className="p-2 text-muted-foreground">{v.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceCharts({
  trendAtt,
  overtimeBars
}: {
  trendAtt: Array<{ label: string; produced: number; waste: number; presentPct: number; prodIdx: number }>;
  overtimeBars: Array<{ hall: string; hours: number }>;
}) {
  return (
    <Card className="erp-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <LineChart className="h-5 w-5 text-primary" />
          تحليلات الإنتاجية والحضور
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8 lg:grid-cols-2">
        <div className="h-56">
          <p className="mb-1 text-[10px] text-muted-foreground">اتجاه الحضور % مقابل مؤشر إنتاج</p>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendAtt}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis yAxisId="l" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis yAxisId="r" orientation="left" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
              <Legend />
              <Area
                yAxisId="l"
                type="monotone"
                dataKey="presentPct"
                name="حضور %"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary) / 0.12)"
              />
              <Line yAxisId="r" type="monotone" dataKey="prodIdx" name="مؤشر إنتاج" stroke="#6366f1" dot={false} strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="h-56">
          <p className="mb-1 text-[10px] text-muted-foreground">ساعات إضافي حسب المنطقة</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overtimeBars}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="hall" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="hours" name="ساعات" fill="#a855f7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function FinancialOpsBlocks({ fin, dashboard }: { fin: ReturnType<typeof financeModel>; dashboard: LiveDashboard }) {
  return (
    <Card className="erp-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Banknote className="h-5 w-5 text-primary" />
          الملخص المالي التشغيلي
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["الإيراد", fin.revenueToday, "text-primary"],
          ["المصروف", fin.opex, "text-orange-600 dark:text-orange-400"],
          ["صافي الربح", fin.netProfit, fin.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"],
          ["هامش صافٍ", `${fin.margin}%`, "text-violet-600 dark:text-violet-400"]
        ].map(([label, val, cls]) => (
          <div key={String(label)} className="rounded-xl border border-border bg-muted/30 p-4 dark:bg-muted/15">
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p className={`mt-1 text-xl font-bold tabular-nums ${cls}`}>
              {typeof val === "number" ? val.toLocaleString("ar") : val}
            </p>
          </div>
        ))}
        <div className="sm:col-span-2 lg:col-span-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
          مرتبط تلقائياً بـ KPIs المصنع: استخدام ماكينات {dashboard.kpis.machineUtilization}% · هدر {dashboard.kpis.wasteRate}% · تذاكر{" "}
          {dashboard.kpis.openMaintenanceTickets}.
        </div>
      </CardContent>
    </Card>
  );
}

function IndustrialAccounting({ dashboard, fin }: { dashboard: LiveDashboard; fin: ReturnType<typeof financeModel> }) {
  const produced = dashboard.kpis.producedPiecesToday;
  const costPerPiece = produced ? Math.round((fin.opex / produced) * 100) / 100 : 0;
  const costPerKg = dashboard.kpis.producedWeightKgToday
    ? Math.round((fin.materialCost / dashboard.kpis.producedWeightKgToday) * 100) / 100
    : 0;
  return (
    <Card className="erp-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          محاسبة مصنعية ذكية
        </CardTitle>
        <p className="text-xs text-muted-foreground">ربط أوامر الإنتاج، الاستهلاك، الصيانة، الرواتب، الهدر، التوقف.</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {[
          ["تكلفة تقديرية / قطعة", `${costPerPiece} ر.س`],
          ["تكلفة خام / كغ", `${costPerKg} ر.س`],
          ["تأثير التوقف (يوم)", `${Math.round(dashboard.machines.reduce((s, m) => s + m.downtimeMinutesToday, 0) * 45).toLocaleString("ar")} ر.س`],
          ["تكلفة هدر اليوم", `${fin.wasteCost.toLocaleString("ar")} ر.س`]
        ].map(([k, v]) => (
          <div key={String(k)} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-mono font-semibold">{v}</span>
          </div>
        ))}
        <Button variant="outline" className="w-full" asChild>
          <Link href={"/ar/inventory" as Route}>استهلاك مخزون</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ExpenseCategories({ fin }: { fin: ReturnType<typeof financeModel> }) {
  const rows: [string, number][] = [
    ["مواد خام", fin.materialCost],
    ["طاقة", fin.energyCost],
    ["صيانة ومستلزمات", fin.maintCost],
    ["يد عاملة اليوم", fin.laborDaily],
    ["هدر ومخلفات", fin.wasteCost],
    ["خدمات ولوجستيات", fin.logistics]
  ];
  const max = Math.max(...rows.map((r) => r[1]), 1);
  return (
    <Card className="erp-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowDownRight className="h-5 w-5 text-orange-500" />
          تصنيف المصاريف وسير الموافقات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map(([name, amt]) => (
          <div key={String(name)}>
            <div className="mb-1 flex justify-between text-xs">
              <span>{name}</span>
              <span className="font-mono">{amt.toLocaleString("ar")} ر.س</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (amt / max) * 100)}%` }} />
            </div>
          </div>
        ))}
        <p className="text-[11px] text-muted-foreground">تنبيهات ذكية عند تجاوز ميزانية بند أو انحراف عن متوسط 7 أيام.</p>
      </CardContent>
    </Card>
  );
}

function PurchaseFinance({
  rows
}: {
  rows: Array<{ sup: string; pending: string; perf: string }>;
}) {
  return (
    <Card className="erp-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Truck className="h-5 w-5 text-primary" />
          المشتريات وأرصدة المورّدين
        </CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="text-muted-foreground">
              <th className="p-2">مورّد</th>
              <th className="p-2">مستحقات</th>
              <th className="p-2">أداء</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.sup} className="border-t border-border">
                <td className="p-2">{r.sup}</td>
                <td className="p-2 font-mono">{r.pending}</td>
                <td className="p-2">
                  <Badge variant="outline">{r.perf}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function SalesFinance({
  rows,
  fin
}: {
  rows: Array<{ cust: string; out: string; prog: string }>;
  fin: ReturnType<typeof financeModel>;
}) {
  return (
    <Card className="erp-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          المبيعات وأرصدة العملاء
        </CardTitle>
        <p className="text-xs text-muted-foreground">إيراد اليوم المركّب: {fin.revenueToday.toLocaleString("ar")} ر.س</p>
      </CardHeader>
      <CardContent>
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="text-muted-foreground">
              <th className="p-2">عميل</th>
              <th className="p-2">مستحق</th>
              <th className="p-2">اتجاه</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.cust} className="border-t border-border">
                <td className="p-2">{r.cust}</td>
                <td className="p-2 font-mono">{r.out}</td>
                <td className="p-2 text-emerald-600 dark:text-emerald-400">{r.prog}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function CostAnalytics({ fin, dashboard }: { fin: ReturnType<typeof financeModel>; dashboard: LiveDashboard }) {
  const downtimeMin = dashboard.machines.reduce((s, m) => s + m.downtimeMinutesToday, 0);
  const laborUtil = dashboard.kpis.machineUtilization;
  return (
    <Card className="erp-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-5 w-5 text-amber-500" />
          تكاليف صناعية وKPIs مالية
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["تكلفة / أمر (متوسط)", "12,840 ر.س"],
          ["تكلفة / ساعة ماكينة", `${Math.round(fin.materialCost / Math.max(1, dashboard.machines.length) / 8).toLocaleString("ar")} ر.س`],
          ["تأثير التوقف (دقيقة)", `${downtimeMin}`],
          ["استخدام القدرة البشرية المركّب", `${laborUtil}%`],
          ["هامش إجمالي تقديري", "34%"],
          ["هامش صافٍ", `${fin.margin}%`],
          ["نقطة تعادل تشغيل", "قريبة من الهدف"],
          ["نتيجة الربحية", `${fin.health}/100`]
        ].map(([k, v]) => (
          <div key={String(k)} className="rounded-xl border border-border bg-muted/25 p-3 dark:bg-muted/10">
            <p className="text-[10px] text-muted-foreground">{k}</p>
            <p className="mt-1 font-semibold">{v}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CashflowPanel({
  cashflowForecast,
  fin,
  wasteRate
}: {
  cashflowForecast: Array<{ m: string; in: number; out: number }>;
  fin: ReturnType<typeof financeModel>;
  wasteRate: number;
}) {
  const data = cashflowForecast.map((c) => ({
    ...c,
    net: c.in - c.out
  }));
  return (
    <Card className="erp-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowUpRight className="h-5 w-5 text-primary" />
          التدفقات النقدية والتنبؤ (أسلوب ذكاء تشغيلي)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          بطاقات مخاطرة: راقب فجوة المواد مع هدر تشغيلي {wasteRate}% — ربط ضمني ببيانات المصنع الحية.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <ReLineChart data={data}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Line type="monotone" dataKey="in" name="تدفّق داخل" stroke="hsl(var(--primary))" strokeWidth={2} dot />
              <Line type="monotone" dataKey="out" name="تدفّق خارج" stroke="#f97316" strokeWidth={2} dot />
            </ReLineChart>
          </ResponsiveContainer>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs dark:bg-amber-950/20">
            <p className="font-semibold text-amber-800 dark:text-amber-200">مخاطر توريد</p>
            <p className="mt-1 text-muted-foreground">دفعات مواد خام خلال 14 يوم — مراقبة SKU حرجة.</p>
          </div>
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs">
            <p className="font-semibold text-primary">تنبؤ رواتب</p>
            <p className="mt-1 text-muted-foreground">مسير الشهر: ~{fin.payrollMonth.toLocaleString("ar")} ر.س</p>
          </div>
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 text-xs dark:bg-emerald-950/20">
            <p className="font-semibold text-emerald-800 dark:text-emerald-200">فرصة تحسين</p>
            <p className="mt-1 text-muted-foreground">خفض هدر 0.5% يحرر ~{Math.round(fin.wasteCost * 0.15).toLocaleString("ar")} ر.س/يوم</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SafetyCompliance({ employees }: { employees: OpsEmployee[] }) {
  const trained = Math.round(employees.length * 0.92);
  return (
    <Card className="erp-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <HardHat className="h-5 w-5 text-primary" />
          السلامة والامتثال
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {[
          ["تدريبات سلامة محدثة", `${trained}/${employees.length}`],
          ["شهادات رافعة/كهرباء", "8 نشطة"],
          ["تأمين معدات", "ساري — تجديد 90 يوم"],
          ["امتثال معدات وقاية", "97%"],
          ["مخالفات سلامة (شهر)", "1 منخفضة"],
          ["تدقيق داخلي", "مجدول الأسبوع القادم"]
        ].map(([a, b]) => (
          <div key={String(a)} className="rounded-xl border border-border bg-muted/30 p-3 text-sm dark:bg-muted/15">
            <p className="text-[10px] text-muted-foreground">{a}</p>
            <p className="mt-1 font-semibold">{b}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AlertsStack({ items }: { items: Array<{ tag: string; msg: string; tone: string }> }) {
  return (
    <Card className="erp-card sticky top-4 border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Bell className="h-4 w-4 text-primary" />
          تنبيهات تشغيلية حية
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[min(70vh,520px)] space-y-2 overflow-y-auto">
        {items.map((it, i) => (
          <motion.div
            key={`${it.msg}-${i}`}
            initial={{ opacity: 0, x: 8 }}
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

function LeaderboardSidebar({ employees }: { employees: OpsEmployee[] }) {
  const byDept = DEPTS.map((d) => {
    const g = employees.filter((e) => e.department === d.name);
    const best = [...g].sort((a, b) => b.productionEff - a.productionEff)[0];
    return { ...d, best: best?.name ?? "—", avg: g.length ? Math.round(g.reduce((s, e) => s + e.productionEff, 0) / g.length) : 0 };
  });
  return (
    <Card className="erp-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">أفضل الأقسام والورديات</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {byDept.map((r) => (
          <div key={r.key} className="rounded-xl border border-border bg-muted/25 p-3 dark:bg-muted/10">
            <p className="font-semibold">{r.name}</p>
            <p className="mt-1 text-muted-foreground">الأميز: {r.best}</p>
            <p>كفاءة متوسطة: {r.avg}%</p>
          </div>
        ))}
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3">
          <p className="text-[10px] text-primary">تصنيف الورديات</p>
          <p className="mt-1 text-muted-foreground">الوردية المسائية تتصدّر كفاءة التغليف اليوم بناءً على بيانات العرض.</p>
        </div>
      </CardContent>
    </Card>
  );
}
