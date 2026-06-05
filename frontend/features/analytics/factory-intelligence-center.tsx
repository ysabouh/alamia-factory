"use client";

import type React from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  Bolt,
  Brain,
  Cpu,
  Droplets,
  Factory,
  Flame,
  Gauge,
  Layers,
  Radio,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Zap
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LiveDashboard, MachineSnapshot } from "@/types/factory";
import { MoldStatsPanel } from "@/features/molds/management/mold-stats-panel";

type Timeline = "daily" | "weekly" | "monthly" | "yearly";

function hallLabel(t: MachineSnapshot["type"]) {
  if (t === "injection") return "حقن بلاستيك";
  if (t === "blow_molding") return "نفخ العبوات";
  return "خط إنتاج / تغليف";
}

function synthShiftData(machines: MachineSnapshot[]) {
  const base = machines.reduce((s, m) => s + m.producedPiecesToday, 0);
  return [
    { shift: "صباحي", actual: Math.round(base * 0.38), target: Math.round(base * 0.4) },
    { shift: "مسائي", actual: Math.round(base * 0.35), target: Math.round(base * 0.36) },
    { shift: "ليلي", actual: Math.round(base * 0.27), target: Math.round(base * 0.28) }
  ];
}

const downtimeCauseMock = [
  { cause: "هيدروليك", minutes: 124 },
  { cause: "تغذية خام", minutes: 98 },
  { cause: "قالب", minutes: 76 },
  { cause: "كهرباء", minutes: 54 },
  { cause: "جودة / إعداد", minutes: 43 }
];

const wasteCategoryMock = [
  { name: "أبعاد", value: 32, fill: "#f43f5e" },
  { name: "مسامير", value: 24, fill: "#f59e0b" },
  { name: "لون", value: 22, fill: "#a78bfa" },
  { name: "تشوه", value: 15, fill: "#22d3ee" },
  { name: "أخرى", value: 7, fill: "#64748b" }
];

type Props = { dashboard: LiveDashboard };

export function FactoryIntelligenceCenter({ dashboard }: Props) {
  const [timeline, setTimeline] = useState<Timeline>("daily");
  const k = dashboard.kpis;
  const machines = dashboard.machines;

  const scale = timeline === "daily" ? 1 : timeline === "weekly" ? 5.2 : timeline === "monthly" ? 22 : 260;

  const executive = useMemo(() => {
    const downtime = machines.reduce((s, m) => s + m.downtimeMinutesToday, 0);
    const oee = Math.min(96, Math.round(k.machineUtilization * 0.88 + (100 - k.wasteRate) * 0.12));
    const energyKwh = Math.round(machines.reduce((s, m) => s + m.producedWeightKgToday * 1.85 + m.producedPiecesToday * 0.02, 0));
    const quality = Math.max(58, Math.round(100 - k.wasteRate * 2.1 - Math.min(18, dashboard.alerts.filter((a) => a.severity === "critical").length * 5)));
    const profitK = Math.round((k.producedPiecesToday * 0.08 + k.producedWeightKgToday * 0.4 - downtime * 2.2) / 1000);
    return {
      oee,
      efficiency: k.machineUtilization,
      output: Math.round(k.producedPiecesToday * (scale / 1)),
      downtime,
      waste: k.wasteRate,
      energy: energyKwh,
      quality,
      profit: profitK
    };
  }, [k, machines, dashboard.alerts, scale]);

  const halls = useMemo(() => {
    const map = new Map<string, number>();
    machines.forEach((m) => {
      const h = hallLabel(m.type);
      map.set(h, (map.get(h) ?? 0) + m.producedPiecesToday);
    });
    const rows = Array.from(map.entries()).map(([hall, produced]) => ({ hall, produced }));
    return rows.length ? rows : [{ hall: "لا بيانات", produced: 0 }];
  }, [machines]);

  const byMachine = useMemo(
    () =>
      machines
        .map((m) => ({
          code: m.code,
          eff: Math.min(99, 72 + Math.round(m.producedPiecesToday / 120) - Math.min(20, m.downtimeMinutesToday / 8)),
          downtime: m.downtimeMinutesToday,
          runtime: Math.max(0.5, 24 - m.downtimeMinutesToday / 60),
          oee: Math.min(95, 62 + (m.status === "running" ? 22 : 5) - m.downtimeMinutesToday / 12),
          maintHz: m.status === "maintenance" ? "مرتفع" : m.downtimeMinutesToday > 45 ? "متوسط" : "منخفض",
          energy: Math.round(m.producedWeightKgToday * 2.1 + m.producedPiecesToday * 0.03)
        }))
        .sort((a, b) => b.eff - a.eff),
    [machines]
  );

  const shiftData = useMemo(() => synthShiftData(machines), [machines]);

  const trendScaled = useMemo(
    () =>
      dashboard.productionTrend.map((p) => ({
        ...p,
        target: Math.round(p.produced * 1.06)
      })),
    [dashboard.productionTrend]
  );

  const worstDowntime = useMemo(
    () => [...machines].sort((a, b) => b.downtimeMinutesToday - a.downtimeMinutesToday).slice(0, 5),
    [machines]
  );

  const pulse = useMemo(() => {
    const hallsActive = new Set(machines.map((m) => hallLabel(m.type))).size;
    const running = machines.filter((m) => m.status === "running").length;
    const critical = dashboard.alerts.filter((a) => a.severity === "critical").length + machines.filter((m) => m.activeAlert).length;
    const health = Math.round(
      k.machineUtilization * 0.42 + (100 - k.wasteRate) * 0.28 + Math.max(40, 100 - critical * 12) * 0.3
    );
    return { hallsActive, running, critical, health };
  }, [machines, dashboard.alerts, k]);

  const heatCells = useMemo(() => {
    const types: MachineSnapshot["type"][] = ["injection", "blow_molding", "line"];
    return types.map((type, row) => {
      const ms = machines.filter((m) => m.type === type);
      const pressure = ms.length ? ms.reduce((s, m) => s + m.producedPiecesToday + m.downtimeMinutesToday, 0) / ms.length : 10;
      const cols = 6;
      return Array.from({ length: cols }, (_, col) => ({
        id: `${row}-${col}`,
        v: Math.min(100, Math.round(pressure / 15 + col * 8 + row * 6))
      }));
    });
  }, [machines]);

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.06),transparent_48%),#020617] p-4 md:p-6">
      <div className="ds-page mx-auto max-w-[1920px]" dir="rtl">
        <ExecutiveHero executive={executive} timeline={timeline} onTimeline={setTimeline} />

        <LivePulseSection pulse={pulse} />

        <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <ProductionAnalyticsBlock halls={halls} byMachine={machines} shiftData={shiftData} trendScaled={trendScaled} />
            <QualityAndWasteSection dashboard={dashboard} wasteRate={k.wasteRate} trendScaled={trendScaled} />
          </div>
          <div className="space-y-6">
            <FactoryHeatmapSvg heatCells={heatCells} />
            <DowntimeBlock worstDowntime={worstDowntime} machines={machines} />
          </div>
        </section>

        <MachinePerformanceRail byMachine={byMachine} />

        <section className="grid gap-6 xl:grid-cols-2">
          <EnergyAnalytics machines={machines} />
          <InventoryAnalyticsBlock kpis={k} />
        </section>

        <MoldStatsPanel compact />

        <PredictiveCards machines={machines} wasteRate={k.wasteRate} downtimeTotal={executive.downtime} />
      </div>
    </main>
  );
}

function ExecutiveHero({
  executive,
  timeline,
  onTimeline
}: {
  executive: {
    oee: number;
    efficiency: number;
    output: number;
    downtime: number;
    waste: number;
    energy: number;
    quality: number;
    profit: number;
  };
  timeline: Timeline;
  onTimeline: (t: Timeline) => void;
}) {
  const pills: Array<{ label: string; value: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = [
    { label: "OEE", value: `${executive.oee}%`, icon: Gauge, tone: "text-cyan-300" },
    { label: "كفاءة المصنع", value: `${executive.efficiency}%`, icon: Cpu, tone: "text-emerald-300" },
    { label: "إخراج الإنتاج", value: executive.output.toLocaleString("ar"), icon: Factory, tone: "text-sky-300" },
    { label: "وقت التوقف", value: `${executive.downtime} د`, icon: Timer, tone: "text-amber-300" },
    { label: "الهدر %", value: `${executive.waste}%`, icon: Droplets, tone: "text-orange-300" },
    { label: "استهلاك الطاقة kWh", value: executive.energy.toLocaleString("ar"), icon: Bolt, tone: "text-yellow-300" },
    { label: "درجة الجودة", value: `${executive.quality}`, icon: ShieldCheck, tone: "text-violet-300" },
    { label: "تقدير الربحية K$", value: `${executive.profit}`, icon: TrendingUp, tone: "text-teal-300" }
  ];

  const tl: Array<{ id: Timeline; label: string }> = [
    { id: "daily", label: "يومي" },
    { id: "weekly", label: "أسبوعي" },
    { id: "monthly", label: "شهري" },
    { id: "yearly", label: "سنوي" }
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[1.75rem] border border-cyan-500/25 bg-gradient-to-br from-slate-950 via-[#071018] to-[#0a1628] p-6 text-white shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(56,189,248,0.14),transparent_42%)]" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.4em] text-cyan-400/90">FACTORY INTELLIGENCE CORE</p>
          <h1 className="mt-2 text-2xl font-bold md:text-4xl">مركز الذكاء والتحليلات المصنعية</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className="border-emerald-400/40 bg-emerald-950/80 text-emerald-200">
              <Radio className="ml-1 h-3 w-3 text-emerald-400 pulse-live" />
              Neural Ops Stream
            </Badge>
            <Badge variant="outline" className="border-cyan-400/35 text-cyan-100">
              Siemens-grade telemetry
            </Badge>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
            {tl.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onTimeline(t.id)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${timeline === t.id ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30" : "text-slate-400 hover:text-white"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="border-white/20 bg-white/5 text-white hover:bg-white/10" asChild>
            <Link href={"/ar/machines" as Route}>تعمّق — الماكينات</Link>
          </Button>
        </div>
      </div>
      <div className="relative mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {pills.map((pill, i) => {
          const PillIcon = pill.icon;
          return (
            <motion.div
              key={pill.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md"
            >
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-500">
                <PillIcon className={`h-3 w-3 ${pill.tone}`} />
                {pill.label}
              </div>
              <div className={`mt-2 text-xl font-bold tabular-nums ${pill.tone}`}>{pill.value}</div>
            </motion.div>
          );
        })}
      </div>
    </motion.header>
  );
}

function LivePulseSection({ pulse }: { pulse: { hallsActive: number; running: number; critical: number; health: number } }) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} className="grid gap-4 lg:grid-cols-[1.2fr_280px]">
      <Card className="border-cyan-500/20 bg-gradient-to-l from-slate-950/90 to-slate-900/80 text-white">
        <CardContent className="flex flex-wrap items-center justify-between gap-6 p-6">
          <div className="flex flex-wrap gap-8">
            <PulseMetric label="قاعات نشطة" value={pulse.hallsActive.toString()} icon={Layers} />
            <PulseMetric label="ماكينات تشغيل" value={pulse.running.toString()} icon={Activity} />
            <PulseMetric label="تنبيهات حرِجة" value={pulse.critical.toString()} warn icon={AlertTriangle} />
          </div>
          <div className="relative flex h-36 w-36 flex-col items-center justify-center rounded-full border-2 border-cyan-500/40 bg-cyan-500/10 shadow-[0_0_60px_rgba(34,211,238,0.2)]">
            <motion.div
              className="absolute inset-2 rounded-full border border-dashed border-cyan-400/30"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 28, ease: "linear" }}
            />
            <p className="text-xs text-slate-400">Factory Health</p>
            <p className="text-4xl font-black text-cyan-300">{pulse.health}</p>
            <p className="text-[10px] text-slate-500">مؤشر مركّب</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-emerald-500/20 bg-emerald-950/20">
        <CardHeader>
          <CardTitle className="text-sm text-emerald-100">نبض تشغيل لحظي</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-300">
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <motion.div className="h-full bg-gradient-to-l from-emerald-400 to-cyan-400" animate={{ width: ["60%", "92%", "74%"] }} transition={{ repeat: Infinity, duration: 8 }} />
          </div>
          <p>مزامنة مع MES والمستودع — تحديث كل دورة إنتاج.</p>
        </CardContent>
      </Card>
    </motion.section>
  );
}

function PulseMetric({
  label,
  value,
  icon: Icon,
  warn
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  warn?: boolean;
}) {
  return (
    <div>
      <div className={`flex items-center gap-2 text-sm ${warn ? "text-amber-400" : "text-slate-400"}`}>
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className={`mt-2 text-3xl font-bold tabular-nums ${warn ? "text-amber-300" : "text-white"}`}>{value}</p>
    </div>
  );
}

function ProductionAnalyticsBlock({
  halls,
  byMachine,
  shiftData,
  trendScaled
}: {
  halls: { hall: string; produced: number }[];
  byMachine: MachineSnapshot[];
  shiftData: { shift: string; actual: number; target: number }[];
  trendScaled: Array<{ label: string; produced: number; waste: number; target: number }>;
}) {
  const machineBars =
    byMachine.length > 0
      ? byMachine.map((m) => ({ code: m.code, pieces: m.producedPiecesToday }))
      : [{ code: "—", pieces: 0 }];

  return (
    <Card className="border-white/10 bg-slate-950/70 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-5 w-5 text-cyan-400" />
          تحليلات الإنتاج المتقدمة
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8 lg:grid-cols-2">
        <div className="h-56">
          <p className="mb-2 text-[11px] text-slate-500">إنتاج حسب القاعة</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={halls} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.08)" horizontal={false} />
              <XAxis type="number" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis dataKey="hall" type="category" width={88} stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(34,211,238,0.3)" }} />
              <Bar dataKey="produced" fill="url(#barCy)" radius={[0, 6, 6, 0]} />
              <defs>
                <linearGradient id="barCy" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="h-56">
          <p className="mb-2 text-[11px] text-slate-500">إنتاج حسب الماكينة</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={machineBars}>
              <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
              <XAxis dataKey="code" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(34,211,238,0.3)" }} />
              <Bar dataKey="pieces" fill="#38bdf8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="h-56 lg:col-span-2">
          <p className="mb-2 text-[11px] text-slate-500">الاتجاه × الهدف مقابل الفعلي × الورديات</p>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendScaled}>
              <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(148,163,184,0.25)" }} />
              <Legend />
              <Area type="monotone" dataKey="produced" name="فعلي" stroke="#22d3ee" fill="rgba(34,211,238,0.15)" />
              <Line type="monotone" dataKey="target" name="هدف" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3 }} />
              <Bar dataKey="waste" name="هدر" fill="#f97316" opacity={0.35} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="h-52 lg:col-span-2">
          <p className="mb-2 text-[11px] text-slate-500">إنتاج حسب الوردية — هدف مقابل تنفيذ</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shiftData}>
              <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
              <XAxis dataKey="shift" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(148,163,184,0.25)" }} />
              <Legend />
              <Bar dataKey="actual" name="فعلي" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="target" name="هدف" fill="#334155" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function FactoryHeatmapSvg({ heatCells }: { heatCells: { id: string; v: number }[][] }) {
  const cellW = 52;
  const cellH = 36;
  const gap = 4;
  const cols = heatCells[0]?.length ?? 6;
  const rows = heatCells.length;
  const width = cols * (cellW + gap) + 24;
  const height = rows * (cellH + gap) + 56;

  function heatColor(v: number) {
    if (v > 85) return "#f43f5e";
    if (v > 65) return "#f59e0b";
    if (v > 45) return "#22d3ee";
    return "#1e3a4f";
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-400" />
          خريطة حرارة المصنع
        </CardTitle>
        <p className="text-xs text-muted-foreground">ضغط إنتاج · نقاط اختناق · أداء القاعات</p>
      </CardHeader>
      <CardContent dir="ltr">
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          <defs>
            <filter id="hglow">
              <feGaussianBlur stdDeviation="2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <text x={12} y={22} fill="#64748b" fontSize={11} fontWeight={600}>
            Pressure Map (mock topology)
          </text>
          {heatCells.map((row, ri) =>
            row.map((cell, ci) => (
              <motion.rect
                key={cell.id}
                x={12 + ci * (cellW + gap)}
                y={34 + ri * (cellH + gap)}
                width={cellW}
                height={cellH}
                rx={6}
                fill={heatColor(cell.v)}
                stroke="rgba(148,163,184,0.35)"
                strokeWidth={0.5}
                filter="url(#hglow)"
                initial={{ opacity: 0.6 }}
                animate={{ opacity: [0.75, 1, 0.82] }}
                transition={{ repeat: Infinity, duration: 3 + ci * 0.2, delay: ri * 0.15 }}
              />
            ))
          )}
        </svg>
        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-3 w-5 rounded-sm bg-[#f43f5e]" /> ضغط حرِج
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-5 rounded-sm bg-[#f59e0b]" /> مراقبة
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-5 rounded-sm bg-[#22d3ee]" /> مستقر
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-5 rounded-sm bg-[#1e3a4f]" /> خافت
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function DowntimeBlock({ worstDowntime, machines }: { worstDowntime: MachineSnapshot[]; machines: MachineSnapshot[] }) {
  const lostMin = machines.reduce((s, m) => s + m.downtimeMinutesToday, 0);
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Timer className="h-5 w-5 text-amber-500" />
          ذكاء التوقف
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm">
          وقت إنتاج ضائع تقديري مقترن بالتوقف:{" "}
          <span className="font-bold text-amber-200">{Math.round(lostMin * 42).toLocaleString("ar")}</span> قطعة · معادلة تشغيلية
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={downtimeCauseMock} layout="vertical">
              <CartesianGrid stroke="rgba(148,163,184,0.12)" horizontal={false} />
              <XAxis type="number" stroke="#888" tick={{ fontSize: 10 }} />
              <YAxis dataKey="cause" type="category" width={72} stroke="#888" tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="minutes" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">أشد الماكينات توقفاً اليوم</p>
          {worstDowntime.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs">
              <span className="font-medium">{m.code}</span>
              <span className="tabular-nums text-rose-400">{m.downtimeMinutesToday} د</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QualityAndWasteSection({
  dashboard,
  wasteRate,
  trendScaled
}: {
  dashboard: LiveDashboard;
  wasteRate: number;
  trendScaled: Array<{ label: string; waste: number }>;
}) {
  const defectRadar = [
    { cat: "أبعاد", a: 88 },
    { cat: "لون", a: 72 },
    { cat: "مسامير", a: 65 },
    { cat: "سطح", a: 91 },
    { cat: "وزن", a: 79 },
    { cat: "تعبئة", a: 84 }
  ];

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
          الجودة والهدر الذكيان
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8 lg:grid-cols-2">
        <div className="h-52">
          <p className="mb-2 text-[11px] text-muted-foreground">توزيع أسباب الهدر / العيب</p>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={wasteCategoryMock} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={2}>
                {wasteCategoryMock.map((e, i) => (
                  <Cell key={i} fill={e.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="h-52">
          <p className="mb-2 text-[11px] text-muted-foreground">اتجاه الهدر مع الزمن</p>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendScaled}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="label" stroke="#888" tick={{ fontSize: 10 }} />
              <YAxis stroke="#888" tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="waste" stroke="#fb923c" fill="rgba(251,146,60,0.18)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="h-56 lg:col-span-2">
          <p className="mb-2 text-[11px] text-muted-foreground">ملف الجودة حسب خط الإنتاج (Radar)</p>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={defectRadar}>
              <PolarGrid stroke="rgba(148,163,184,0.25)" />
              <PolarAngleAxis dataKey="cat" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar name="جودة نسبية" dataKey="a" stroke="#a78bfa" fill="rgba(167,139,250,0.35)" />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-border bg-muted/40 p-3 lg:col-span-2">
          <p className="text-xs font-semibold text-muted-foreground">رفض وتذاكر الجودة (MES)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {dashboard.alerts.map((a) => (
              <Badge key={a.id} variant={a.severity === "critical" ? "destructive" : a.severity === "warning" ? "warning" : "secondary"}>
                {a.message.slice(0, 48)}
                {a.message.length > 48 ? "…" : ""}
              </Badge>
            ))}
            {dashboard.alerts.length === 0 ? <span className="text-xs text-muted-foreground">لا تنبيهات نشطة في البث الحالي.</span> : null}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            معدل الرفض المركّز الحالي: <span className="font-bold text-foreground">{wasteRate}%</span> (مرتبط KPI المصنع)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function MachinePerformanceRail({ byMachine }: { byMachine: Array<{ code: string; eff: number; downtime: number; runtime: number; oee: number; maintHz: string; energy: number }> }) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Gauge className="h-5 w-5 text-cyan-500" />
          أداء الماكينات — مسار القيادة
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4 pb-2">
          {byMachine.map((m, i) => (
            <motion.div
              key={m.code}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="w-[200px] shrink-0 rounded-2xl border border-border bg-gradient-to-b from-background to-muted/30 p-4"
            >
              <p className="font-mono font-bold">{m.code}</p>
              <div className="mt-3 space-y-2 text-[11px]">
                <RowKV label="كفاءة" value={`${m.eff}%`} />
                <RowKV label="توقف" value={`${m.downtime} د`} />
                <RowKV label="تشغيل" value={`${m.runtime.toFixed(1)} h`} />
                <RowKV label="OEE تقريبي" value={`${m.oee}%`} />
                <RowKV label="صيانة" value={m.maintHz} />
                <RowKV label="طاقة" value={`${m.energy} kWh`} />
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RowKV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 pb-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function EnergyAnalytics({ machines }: { machines: MachineSnapshot[] }) {
  const airNm3 = Math.round(machines.reduce((s, m) => s + (m.type === "blow_molding" ? m.producedPiecesToday * 0.08 : m.producedPiecesToday * 0.015), 0));
  const data =
    machines.length === 0
      ? [{ code: "—", kwh: 0 }]
      : [...machines]
          .sort(
            (a, b) =>
              b.producedWeightKgToday * 2.2 +
              b.producedPiecesToday * 0.03 -
              (a.producedWeightKgToday * 2.2 + a.producedPiecesToday * 0.03)
          )
          .slice(0, 6)
          .map((m) => ({
            code: m.code,
            kwh: Math.round(m.producedWeightKgToday * 2.1 + m.producedPiecesToday * 0.03)
          }));

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          الطاقة والخدمات
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 text-sm">
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">استهلاك ضاغط هواء (تقدير NM³/h)</p>
            <p className="mt-1 text-2xl font-bold text-cyan-600 dark:text-cyan-400">{airNm3.toLocaleString("ar")}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">اتجاه كفاءة الطاقة</p>
            <div className="mt-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm font-medium">تحسن 2.4% عن المتوسط الأسبوعي (نموذج)</span>
            </div>
          </div>
        </div>
        <div className="h-56">
          <p className="mb-2 text-[11px] text-muted-foreground">ترتيب الماكينات حسب استهلاك الطاقة (تقدير kWh)</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" horizontal={false} />
              <XAxis type="number" stroke="#888" tick={{ fontSize: 10 }} />
              <YAxis dataKey="code" type="category" width={72} stroke="#888" tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="kwh" radius={[0, 6, 6, 0]} fill="#eab308">
                {data.map((_, idx) => (
                  <Cell key={`e-${idx}`} fill={idx === 0 ? "#fbbf24" : idx === 1 ? "#f59e0b" : "#78716c"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function InventoryAnalyticsBlock({ kpis }: { kpis: LiveDashboard["kpis"] }) {
  const row = [
    { label: "استهلاك خام متزامن", val: `${Math.round(kpis.producedWeightKgToday * 1.05).toLocaleString("ar")} كغ`, icon: Layers },
    { label: "دوران مخزون (تقدير)", val: "13.6 دورة", icon: TrendingUp },
    { label: "بنود تحت الحد الحرِج", val: kpis.lowStockItems.toString(), icon: AlertTriangle },
    { label: "مخزون راكد (محاكاة)", val: "4 SKU", icon: ArrowDownRight }
  ];
  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-5 w-5 text-violet-500" />
          ذكاء المخزون
        </CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href={"/ar/inventory" as Route}>لوحة المخزون</Link>
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {row.map((r) => (
          <div key={r.label} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
            <r.icon className="h-8 w-8 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[11px] text-muted-foreground">{r.label}</p>
              <p className="text-lg font-bold">{r.val}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PredictiveCards({ machines, wasteRate, downtimeTotal }: { machines: MachineSnapshot[]; wasteRate: number; downtimeTotal: number }) {
  const inj = machines.filter((m) => m.type === "injection");
  const pool = inj.length ? inj : machines;
  const risky =
    pool.length > 0 ? pool.reduce((a, b) => (a.downtimeMinutesToday >= b.downtimeMinutesToday ? a : b), pool[0]) : undefined;

  const cards = [
    {
      title: "تنبؤ صيانة هيدروليك",
      body: risky ? `احتمال عطل خلال 36 ساعة على ${risky.code}` : "لا بيانات كافية",
      conf: 78,
      icon: Cpu,
      tone: "from-rose-950/80 to-slate-900 border-rose-500/30"
    },
    {
      title: "انحدار كفاءة خط",
      body: downtimeTotal > 140 ? "ذروة توقف مرتبطة بتسليم خام — مراجعة جدولة الشاحنات." : "الخط ضمن النطاق المستهدف.",
      conf: downtimeTotal > 140 ? 71 : 52,
      icon: TrendingDown,
      tone: "from-amber-950/70 to-slate-900 border-amber-500/30"
    },
    {
      title: "تحذير هدر متصاعد",
      body: wasteRate > 3 ? `الهدر فوق المتوسط (${wasteRate}%): راجع إعدادات الحقن الباردة.` : "الهدر تحت السيطرة.",
      conf: wasteRate > 3 ? 84 : 46,
      icon: Droplets,
      tone: "from-cyan-950/70 to-slate-900 border-cyan-500/25"
    },
    {
      title: "كشف اختناق",
      body: "منطقة النفخ تعمل عند 94% سعة — إعادة توازي التغذية الموصى بها.",
      conf: 69,
      icon: Activity,
      tone: "from-violet-950/75 to-slate-900 border-violet-500/35"
    }
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`rounded-2xl border bg-gradient-to-br p-5 text-white shadow-xl ${c.tone}`}
        >
          <div className="flex items-start justify-between gap-2">
            <c.icon className="h-6 w-6 text-cyan-300" />
            <Badge variant="secondary" className="border-white/10 bg-white/10 text-[10px] text-white">
              ثقة {c.conf}%
            </Badge>
          </div>
          <p className="mt-4 flex items-center gap-1 text-sm font-semibold text-slate-100">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            {c.title}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">{c.body}</p>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full bg-gradient-to-l from-cyan-400 to-emerald-400" initial={{ width: "12%" }} animate={{ width: `${c.conf}%` }} transition={{ duration: 1.2 }} />
          </div>
        </motion.div>
      ))}
    </section>
  );
}
