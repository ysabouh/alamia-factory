"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Bolt,
  Cpu,
  Gauge,
  Layers,
  Radio,
  ScrollText,
  Siren,
  Thermometer,
  Timer,
  TrendingDown,
  Wind,
  X,
  Zap,
  Factory
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LiveDashboard, MachineSnapshot } from "@/types/factory";

type VisualStatus = "running" | "warning" | "critical" | "maintenance" | "offline";

function visualStatus(m: MachineSnapshot): VisualStatus {
  if (m.status === "down") return "critical";
  if (m.status === "maintenance") return "maintenance";
  if (m.activeAlert) return "warning";
  if (m.status === "running") return "running";
  return "offline";
}

/** يتماشى مع ألوان الحالة في globals + tailwind factory */
const statusRing: Record<VisualStatus, string> = {
  running: "rgb(34 197 94)",
  warning: "rgb(245 158 11)",
  critical: "rgb(239 68 68)",
  maintenance: "rgb(14 165 233)",
  offline: "rgb(100 116 139)"
};

function telemetryFor(machine: MachineSnapshot, tick: number) {
  const wobble = 1 + 0.02 * Math.sin(tick / 3);
  const temp = machine.type === "injection" ? 205 + (tick % 7) * 0.8 : machine.type === "blow_molding" ? 172 + (tick % 5) * 0.6 : 38;
  const pressure = machine.type === "injection" ? 142 + (tick % 4) * 1.2 : machine.type === "blow_molding" ? 9.2 + (tick % 3) * 0.15 : 62;
  const cycle = machine.status === "running" ? (18.2 / wobble + (machine.id % 3) * 0.4).toFixed(1) : "—";
  const eff = Math.min(99, Math.max(28, 72 + machine.producedPiecesToday / 200 - machine.downtimeMinutesToday / 6 + Math.sin(tick) * 2));
  const runtime = Math.max(0, 24 - machine.downtimeMinutesToday / 60);
  const outPerH = machine.status === "running" ? Math.round((machine.producedPiecesToday / Math.max(1, runtime)) * wobble) : 0;
  return {
    temp: Math.round(temp * 10) / 10,
    pressure: Math.round(pressure * 10) / 10,
    cycle,
    eff: Math.round(eff),
    runtime: runtime.toFixed(1),
    outPerH,
    vibration: (1.2 + machine.id * 0.08 + Math.sin(tick / 2) * 0.15).toFixed(2),
    err: machine.status === "down" ? "E-4401" : machine.activeAlert ? "WARN-12" : "OK"
  };
}

const activitySeed = [
  "بدء وردية — تزامن MES",
  "تغيير قالب — BLW-02",
  "توقف قصير — تغذية خام",
  "إغلاق تنبيه جودة — عيوب أبعاد",
  "صيانة وقائية مجدولة — INJ-04"
];

type Props = { dashboard: LiveDashboard };

export function LiveFactoryMonitoringCenter({ dashboard }: Props) {
  const [tick, setTick] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const machines = dashboard.machines;
  const k = dashboard.kpis;

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 2200);
    return () => window.clearInterval(id);
  }, []);

  const running = machines.filter((m) => m.status === "running").length;
  const stopped = machines.filter((m) => m.status === "idle" || m.status === "down").length;
  const criticalAlerts =
    dashboard.alerts.filter((a) => a.severity === "critical").length + machines.filter((m) => m.status === "down").length;
  const warnCount = machines.filter((m) => m.activeAlert).length + dashboard.alerts.filter((a) => a.severity === "warning").length;

  const liveRate = useMemo(() => {
    const base = k.producedPiecesToday / Math.max(1, 10 - tick * 0.001);
    return Math.round(base * (1 + 0.02 * Math.sin(tick / 2)));
  }, [k.producedPiecesToday, tick]);

  const energyLive = useMemo(
    () => Math.round(machines.reduce((s, m) => s + m.producedWeightKgToday * 1.9 + m.producedPiecesToday * 0.02, 0) * (1 + 0.01 * Math.sin(tick))),
    [machines, tick]
  );

  const health = useMemo(
    () =>
      Math.round(
        k.machineUtilization * 0.38 + (100 - k.wasteRate) * 0.22 + Math.max(35, 100 - criticalAlerts * 14 - warnCount * 5) * 0.4
      ),
    [k.machineUtilization, k.wasteRate, criticalAlerts, warnCount]
  );

  const selected = machines.find((m) => m.id === selectedId) ?? null;
  const hallGroups = useMemo(() => {
    const inj = machines.filter((m) => m.type === "injection");
    const blow = machines.filter((m) => m.type === "blow_molding");
    const line = machines.filter((m) => m.type === "line");
    return [
      { id: "inj", name: "قاعة الحقن", machines: inj.length ? inj : machines.slice(0, 1) },
      { id: "blow", name: "قاعة النفخ", machines: blow.length ? blow : [] },
      { id: "line", name: "التغليف / الخط", machines: line.length ? line : [] }
    ].filter((h) => h.machines.length > 0);
  }, [machines]);

  const bottlenecks = useMemo(
    () =>
      [...machines]
        .sort((a, b) => b.downtimeMinutesToday - a.downtimeMinutesToday || a.producedPiecesToday - b.producedPiecesToday)
        .slice(0, 4),
    [machines]
  );

  const timeline = useMemo(() => {
    const rows: Array<{ t: string; msg: string; tone: "ok" | "warn" | "crit" }> = [];
    machines.forEach((m, i) => {
      if (m.status === "running")
        rows.push({ t: `${10 + (i % 8)}:${12 + i * 3}`, msg: `تشغيل ${m.code} — ${m.currentMold ?? "بدون قالب"}`, tone: "ok" });
      if (m.activeAlert) rows.push({ t: `${11 + i}:${20 + i}`, msg: `${m.code}: ${m.activeAlert}`, tone: "warn" });
      if (m.status === "maintenance") rows.push({ t: `${9 + i}:45`, msg: `صيانة ${m.code}`, tone: "warn" });
    });
    dashboard.alerts.forEach((a, i) => {
      rows.push({
        t: `${14 + i}:0${i}`,
        msg: a.message,
        tone: a.severity === "critical" ? "crit" : a.severity === "warning" ? "warn" : "ok"
      });
    });
    activitySeed.slice(0, 3).forEach((msg, i) => rows.push({ t: `${8 + i}:15`, msg, tone: "ok" }));
    return rows.slice(0, 18);
  }, [machines, dashboard.alerts]);

  const chartLive = useMemo(
    () =>
      dashboard.productionTrend.map((p, i) => ({
        ...p,
        rate: Math.round(p.produced / Math.max(1, i + 1) + tick * 1.5 + Math.sin(i + tick) * 40),
        util: Math.min(100, k.machineUtilization + Math.sin(i + tick) * 4)
      })),
    [dashboard.productionTrend, k.machineUtilization, tick]
  );

  return (
    <main className="min-h-screen bg-background p-4 text-foreground md:p-6">
      <div className="mx-auto max-w-[1920px] space-y-5" dir="rtl">
        <GlobalStatusBar
          factoryOk={criticalAlerts === 0}
          running={running}
          stopped={stopped}
          criticalAlerts={criticalAlerts}
          warnCount={warnCount}
          liveRate={liveRate}
          energyLive={energyLive}
          health={health}
        />

        <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            <LiveFloorMap machines={machines} onSelectMachine={setSelectedId} selectedId={selectedId} tick={tick} />
            <LiveMetricsCharts chartLive={chartLive} wasteRate={k.wasteRate} downtimeTotal={machines.reduce((s, m) => s + m.downtimeMinutesToday, 0)} />
          </div>
          <div className="space-y-5">
            <AlertsStreamPanel dashboard={dashboard} machines={machines} />
            <ActivityTimeline rows={timeline} />
          </div>
        </section>

        <MachineLiveFeed machines={machines} tick={tick} onSelect={setSelectedId} selectedId={selectedId} />

        <HallMonitoringRow hallGroups={hallGroups} tick={tick} />

        <BottleneckStrip machines={bottlenecks} hallGroups={hallGroups} />

        <TelemetryDrawer machine={selected} tick={tick} onClose={() => setSelectedId(null)} />
      </div>
    </main>
  );
}

function GlobalStatusBar({
  factoryOk,
  running,
  stopped,
  criticalAlerts,
  warnCount,
  liveRate,
  energyLive,
  health
}: {
  factoryOk: boolean;
  running: number;
  stopped: number;
  criticalAlerts: number;
  warnCount: number;
  liveRate: number;
  energyLive: number;
  health: number;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="erp-card relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-l from-card via-card to-muted/30 px-4 py-4 shadow-[0_0_48px_hsl(var(--primary)/0.12)] md:px-6 dark:from-card dark:via-card dark:to-muted/20"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,hsl(var(--primary)/0.08),transparent_42%)]" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/35 bg-primary/10">
            <Factory className="h-7 w-7 text-primary" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] tracking-[0.35em] text-primary/90">MES · LIVE MONITORING</span>
              <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">
                <span className="ml-1 h-2 w-2 rounded-full bg-emerald-500 pulse-live" />
                SCADA STREAM
              </Badge>
            </div>
            <h1 className="mt-1 text-xl font-bold text-card-foreground md:text-2xl">مركز المراقبة المصنعية الحية</h1>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>حالة المصنع:</span>
              <span className={factoryOk ? "font-semibold text-emerald-600 dark:text-emerald-400" : "font-semibold text-destructive"}>
                {factoryOk ? "تشغيل طبيعي" : "يتطلب تدخلاً"}
              </span>
              <span className="text-border">|</span>
              <span>تنبيهات تحذيرية: {warnCount}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:flex-wrap lg:justify-end">
          <MiniStat icon={Gauge} label="ماكينات تعمل" value={running.toString()} tone="text-emerald-600 dark:text-emerald-400" />
          <MiniStat icon={Timer} label="متوقفة/خامدة" value={stopped.toString()} tone="text-muted-foreground" />
          <MiniStat icon={Siren} label="حرجة" value={criticalAlerts.toString()} tone="text-destructive" pulse={criticalAlerts > 0} />
          <MiniStat icon={Activity} label="معدل الإنتاج" value={liveRate.toLocaleString("ar")} suffix="/دُفعة" tone="text-primary" />
          <MiniStat icon={Bolt} label="الطاقة kWh تقدير" value={energyLive.toLocaleString("ar")} tone="text-amber-600 dark:text-amber-300" />
          <MiniStat icon={Cpu} label="صحة المصنع" value={`${health}`} suffix="%" tone="text-sky-700 dark:text-sky-300" />
        </div>
      </div>
    </motion.header>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  suffix,
  tone,
  pulse
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  suffix?: string;
  tone: string;
  pulse?: boolean;
}) {
  return (
    <div className="min-w-[7.5rem] rounded-xl border border-border bg-card/80 px-3 py-2.5 dark:bg-card/60">
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Icon className={`h-3.5 w-3.5 ${pulse ? "text-destructive pulse-live" : "text-muted-foreground"}`} />
        {label}
      </div>
      <div className={`mt-1 text-lg font-bold tabular-nums leading-none ${tone}`}>
        {value}
        {suffix ? <span className="mr-1 text-[10px] font-normal opacity-70">{suffix}</span> : null}
      </div>
    </div>
  );
}

function LiveFloorMap({
  machines,
  onSelectMachine,
  selectedId,
  tick
}: {
  machines: MachineSnapshot[];
  onSelectMachine: (id: number | null) => void;
  selectedId: number | null;
  tick: number;
}) {
  const halls: Array<{ key: string; label: string; x: number; y: number; w: number; h: number; type: MachineSnapshot["type"] }> = [
    { key: "inj", label: "الحقن", x: 4, y: 10, w: 44, h: 78, type: "injection" },
    { key: "blow", label: "النفخ", x: 52, y: 10, w: 44, h: 36, type: "blow_molding" },
    { key: "line", label: "التغليف", x: 52, y: 52, w: 44, h: 36, type: "line" }
  ];

  function machinesInHall(t: MachineSnapshot["type"]) {
    return machines.filter((m) => m.type === t);
  }

  function hallHealth(ms: MachineSnapshot[]) {
    if (!ms.length) return 72;
    const run = ms.filter((m) => m.status === "running").length / ms.length;
    const down = ms.reduce((s, m) => s + m.downtimeMinutesToday, 0) / ms.length;
    return Math.round(42 + run * 45 - Math.min(25, down / 8));
  }

  return (
    <Card className="erp-card border-border bg-card text-card-foreground">
      <CardHeader className="border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-5 w-5 text-primary" />
            خريطة الأرضية الحية · SCADA Topology
          </CardTitle>
          <Badge variant="outline" className="border-primary/40 text-primary">
            tick #{tick}
          </Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-muted-foreground">
          <LegendDot color="bg-emerald-500" label="تشغيل" />
          <LegendDot color="bg-amber-500" label="تحذير" />
          <LegendDot color="bg-rose-500" label="حرِج" />
          <LegendDot color="bg-sky-500" label="صيانة" />
          <LegendDot color="bg-slate-500 dark:bg-slate-600" label="متوقف" />
        </div>
      </CardHeader>
      <CardContent dir="ltr" className="p-4">
        <svg viewBox="0 0 100 100" className="factory-grid h-[min(340px,50vh)] w-full rounded-xl border border-primary/15 bg-muted/40 dark:bg-factory-panel/80">
          <defs>
            <linearGradient id="floorGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(14,165,233,0.07)" />
              <stop offset="100%" stopColor="rgba(56,189,248,0.04)" />
            </linearGradient>
          </defs>
          <rect x="2" y="4" width="96" height="92" rx="2" fill="url(#floorGlow)" stroke="rgba(14,165,233,0.22)" strokeWidth="0.4" />

          {/* Flow */}
          <motion.path
            d="M 48 54 L 50 54 L 50 28 L 52 28"
            fill="none"
            stroke="rgba(14,165,233,0.42)"
            strokeWidth="0.6"
            strokeDasharray="2 2"
            animate={{ strokeDashoffset: [0, -8] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
          />

          {halls.map((h) => {
            const ms = machinesInHall(h.type);
            const hh = hallHealth(ms);
            return (
              <g key={h.key}>
                <rect
                  x={h.x}
                  y={h.y}
                  width={h.w}
                  height={h.h}
                  rx="1.2"
                  fill="rgba(15,23,42,0.6)"
                  stroke={hh > 72 ? "rgba(14,165,233,0.38)" : hh > 50 ? "rgba(245,158,11,0.45)" : "rgba(239,68,68,0.5)"}
                  strokeWidth="0.5"
                />
                <text x={h.x + 2} y={h.y + 5} fill="#94a3b8" fontSize="3.2" fontWeight={700}>
                  {h.label} · صحة {hh}%
                </text>
                {ms.map((m, idx) => {
                  const vx = visualStatus(m);
                  const col = idx % 4;
                  const row = Math.floor(idx / 4);
                  const cx = h.x + 10 + col * 10;
                  const cy = h.y + 18 + row * 12;
                  const sel = selectedId === m.id;
                  return (
                    <g key={m.id} className="cursor-pointer" onClick={() => onSelectMachine(m.id)}>
                      <motion.circle
                        cx={cx}
                        cy={cy}
                        r={sel ? 4.8 : 3.9}
                        fill={statusRing[vx]}
                        stroke={sel ? "#fff" : "rgba(255,255,255,0.35)"}
                        strokeWidth={sel ? 0.6 : 0.35}
                        animate={vx === "running" ? { opacity: [0.85, 1, 0.9] } : vx === "warning" ? { opacity: [1, 0.45, 1] } : {}}
                        transition={{ repeat: Infinity, duration: vx === "warning" ? 0.9 : 2 }}
                      />
                      <text x={cx} y={cy + 7} textAnchor="middle" fill="#94a3b8" fontSize="2.6">
                        {m.code.replace(/[^A-Z0-9-]/gi, "")}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">اضغط على عقدة ماكينة لفتح لوحة التليمتري الحية</p>
      </CardContent>
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function AlertsStreamPanel({ dashboard, machines }: { dashboard: LiveDashboard; machines: MachineSnapshot[] }) {
  const items: Array<{ text: string; sev: "crit" | "warn" | "info" }> = [];
  machines.forEach((m) => {
    if (m.activeAlert) items.push({ text: `${m.code}: ${m.activeAlert}`, sev: "warn" });
    if (m.status === "down") items.push({ text: `${m.code}: عطل تشغيل`, sev: "crit" });
    if (m.status === "maintenance") items.push({ text: `${m.code}: صيانة نشطة`, sev: "info" });
  });
  dashboard.alerts.forEach((a) => {
    items.push({
      text: a.message,
      sev: a.severity === "critical" ? "crit" : a.severity === "warning" ? "warn" : "info"
    });
  });
  if (dashboard.kpis.lowStockItems > 0) {
    items.push({ text: `مخزون منخفض: ${dashboard.kpis.lowStockItems} بنود`, sev: "warn" });
  }

  return (
    <Card className="erp-card border-destructive/20 bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm text-foreground">
          <Radio className="h-4 w-4 text-destructive pulse-live" />
          تدفق التنبيهات اللحظي
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
        {items.length === 0 ? <p className="text-xs text-muted-foreground">لا تنبيهات في البث الحالي.</p> : null}
        {items.slice(0, 14).map((it, i) => (
          <motion.div
            key={`${it.text}-${i}`}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`rounded-xl border px-3 py-2 text-xs leading-relaxed ${
              it.sev === "crit"
                ? "border-destructive/40 bg-destructive/10 text-destructive dark:bg-rose-950/50 dark:text-rose-100"
                : it.sev === "warn"
                  ? "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
                  : "border-primary/25 bg-primary/5 text-sky-900 dark:bg-primary/10 dark:text-sky-100"
            }`}
          >
            {it.text}
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

function ActivityTimeline({ rows }: { rows: Array<{ t: string; msg: string; tone: "ok" | "warn" | "crit" }> }) {
  return (
    <Card className="erp-card border-border bg-card">
      <CardHeader>
        <CardTitle className="text-sm">خط زمني للأحداث</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[260px] space-y-2 overflow-y-auto text-xs">
        {rows.map((r, i) => (
          <div key={`${r.t}-${i}`} className="flex gap-3 border-r-2 border-primary/25 pr-3">
            <span className="shrink-0 font-mono text-muted-foreground">{r.t}</span>
            <span
              className={
                r.tone === "crit"
                  ? "text-destructive"
                  : r.tone === "warn"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-foreground"
              }
            >
              {r.msg}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function LiveMetricsCharts({
  chartLive,
  wasteRate,
  downtimeTotal
}: {
  chartLive: Array<{ label: string; produced: number; waste: number; rate: number; util: number }>;
  wasteRate: number;
  downtimeTotal: number;
}) {
  const barRows = chartLive.map((c, i) => ({
    ...c,
    energyEst: Math.round(c.produced * 0.08 + i * 12 + wasteRate * 8)
  }));

  return (
    <Card className="erp-card border-border bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-5 w-5 text-primary" />
          مقاييس تشغيل لحظية
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8 lg:grid-cols-2">
        <div className="h-56">
          <p className="mb-1 text-[10px] text-muted-foreground">معدل إنتاج · استخدام ماكينات</p>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartLive}>
              <CartesianGrid stroke="rgba(148,163,184,0.1)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis yAxisId="l" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fill: "#64748b", fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--card-foreground))"
                }}
              />
              <Legend />
              <Area yAxisId="l" type="monotone" dataKey="rate" name="معدل" stroke="#0ea5e9" fill="rgba(14,165,233,0.14)" />
              <Line yAxisId="r" type="monotone" dataKey="util" name="استخدام %" stroke="#6366f1" dot={false} strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="h-56">
          <p className="mb-1 text-[10px] text-muted-foreground">هدر · طاقة تقديرية · توقف إجمالي {downtimeTotal} د</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barRows}>
              <CartesianGrid stroke="rgba(148,163,184,0.1)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--card-foreground))"
                }}
              />
              <Legend />
              <Bar dataKey="waste" name="هدر" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="energyEst" name="طاقة تقديرية" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function MachineLiveFeed({
  machines,
  tick,
  onSelect,
  selectedId
}: {
  machines: MachineSnapshot[];
  tick: number;
  onSelect: (id: number) => void;
  selectedId: number | null;
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Zap className="h-5 w-5 text-amber-500" />
        بث الماكينات الحي
      </h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {machines.map((m, i) => {
          const tel = telemetryFor(m, tick + i);
          const sel = selectedId === m.id;
          return (
            <motion.button
              key={m.id}
              type="button"
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onSelect(m.id)}
              className={`erp-card rounded-2xl border p-4 text-right transition ${
                sel
                  ? "border-primary/50 bg-primary/10 shadow-[0_0_28px_hsl(var(--primary)/0.18)]"
                  : "border-border bg-card hover:border-primary/35"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-bold text-card-foreground">{m.code}</p>
                  <p className="text-[11px] text-muted-foreground">{m.name}</p>
                </div>
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: statusRing[visualStatus(m)] }} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <MetricCell icon={Thermometer} label="حرارة" value={`${tel.temp}°C`} />
                <MetricCell icon={Wind} label="ضغط" value={`${tel.pressure}`} />
                <MetricCell icon={Timer} label="دورة" value={`${tel.cycle}`} />
                <MetricCell icon={Gauge} label="كفاءة" value={`${tel.eff}%`} />
                <MetricCell icon={Activity} label="تشغيل h" value={tel.runtime} />
                <MetricCell icon={Factory} label="إخراج/س" value={tel.outPerH.toLocaleString("ar")} />
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

function MetricCell({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/25 px-2 py-1.5">
      <Icon className="h-3.5 w-3.5 text-cyan-500/90" />
      <div className="min-w-0">
        <p className="text-[9px] text-slate-500">{label}</p>
        <p className="truncate font-semibold tabular-nums text-slate-200">{value}</p>
      </div>
    </div>
  );
}

function HallMonitoringRow({ hallGroups, tick }: { hallGroups: Array<{ id: string; name: string; machines: MachineSnapshot[] }>; tick: number }) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {hallGroups.map((h) => {
        const run = h.machines.filter((m) => m.status === "running").length;
        const eff = Math.round(h.machines.reduce((s, m) => s + telemetryFor(m, tick).eff, 0) / Math.max(1, h.machines.length));
        const alertN = h.machines.filter((m) => m.activeAlert || m.status === "maintenance").length;
        const tempHall = Math.round(h.machines.reduce((s, m) => s + telemetryFor(m, tick).temp, 0) / Math.max(1, h.machines.length));
        const energy = Math.round(h.machines.reduce((s, m) => s + telemetryFor(m, tick).pressure * 2.2, 0));
        return (
          <motion.div
            key={h.id}
            whileHover={{ y: -2 }}
            className="erp-card rounded-2xl border border-border bg-card p-4 dark:bg-gradient-to-br dark:from-card dark:to-muted/30"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{h.name}</p>
            <p className="mt-1 text-2xl font-bold text-card-foreground">{eff}%</p>
            <p className="text-[11px] text-muted-foreground">كفاءة مركّبة للقاعة</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-foreground">
              <div className="rounded-lg bg-muted/50 p-2 dark:bg-black/25">
                تشغيل: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{run}/{h.machines.length}</span>
              </div>
              <div className="rounded-lg bg-muted/50 p-2 dark:bg-black/25">
                تنبيهات: <span className="font-semibold text-amber-600 dark:text-amber-400">{alertN}</span>
              </div>
              <div className="rounded-lg bg-muted/50 p-2 dark:bg-black/25">
                متوسط الحرارة: <span className="font-mono">{tempHall}°</span>
              </div>
              <div className="rounded-lg bg-muted/50 p-2 dark:bg-black/25">طاقة تقدير: <span className="font-mono">{energy}</span></div>
            </div>
          </motion.div>
        );
      })}
    </section>
  );
}

function BottleneckStrip({ machines, hallGroups }: { machines: MachineSnapshot[]; hallGroups: Array<{ name: string; machines: MachineSnapshot[] }> }) {
  const congested = hallGroups
    .map((h) => {
      const avgD = h.machines.reduce((s, m) => s + m.downtimeMinutesToday, 0) / Math.max(1, h.machines.length);
      return { name: h.name, avgD, ms: h.machines };
    })
    .sort((a, b) => b.avgD - a.avgD)[0];

  return (
    <Card className="erp-card border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-card to-card dark:from-amber-950/25 dark:via-card dark:to-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-amber-800 dark:text-amber-100">
          <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400" />
          كشف الاختناقات والمناطق الحرجة
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-4">
        {machines.map((m) => (
          <div
            key={m.id}
            className={`min-w-[200px] flex-1 rounded-xl border px-3 py-2 text-xs ${
              m.downtimeMinutesToday > 50
                ? "border-destructive/40 bg-destructive/10 text-destructive dark:bg-rose-950/40 dark:text-rose-100"
                : "border-border bg-muted/30 text-foreground dark:bg-black/20 dark:text-muted-foreground"
            }`}
          >
            <span className="font-bold">{m.code}</span> · بطء تشغيل: {m.downtimeMinutesToday} د
          </div>
        ))}
        {congested ? (
          <div className="min-w-[220px] flex-1 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            <div className="flex items-center gap-1 font-semibold">
              <TrendingDown className="inline h-4 w-4 rotate-[-90deg]" />
              ضغط في {congested.name}
            </div>
            <p className="mt-1 text-amber-800/90 dark:text-amber-200/80">متوسط التوقف: {Math.round(congested.avgD)} دقيقة · أولوية تدفق المواد</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TelemetryDrawer({
  machine,
  tick,
  onClose
}: {
  machine: MachineSnapshot | null;
  tick: number;
  onClose: () => void;
}) {
  const tel = machine ? telemetryFor(machine, tick) : null;

  const logs = machine
    ? [
        `[${tick % 24}:${(tick * 7) % 60}] SYNC PLC ok`,
        machine.activeAlert ? `WARN: ${machine.activeAlert}` : "جودة ضمن النطاق",
        machine.status === "maintenance" ? "وضع صيانة — تخطيط إيقاف جزئي" : "جدولة محافظ دورية"
      ]
    : [];

  return (
    <AnimatePresence>
      {machine && tel ? (
        <>
          <motion.button
            type="button"
            aria-label="إغلاق"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%", opacity: 0.95 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.9 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="erp-card fixed inset-y-0 start-0 z-50 flex w-full max-w-md flex-col border-e border-primary/25 bg-card shadow-2xl shadow-primary/10"
          >
            <div className="flex items-start justify-between border-b border-border p-5">
              <div>
                <p className="text-[10px] text-primary">LIVE TELEMETRY SESSION</p>
                <p className="font-mono text-xl font-bold text-card-foreground">{machine.code}</p>
                <p className="mt-1 text-xs text-muted-foreground">{machine.name}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-border bg-muted/30 p-3 dark:bg-muted/20">
                  <p className="text-[10px] text-muted-foreground">حرارة القالب</p>
                  <p className="mt-1 text-lg font-bold text-primary">{tel.temp}°C</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-3 dark:bg-muted/20">
                  <p className="text-[10px] text-muted-foreground">اهتزاز mm/s</p>
                  <p className="mt-1 text-lg font-bold text-amber-600 dark:text-amber-300">{tel.vibration}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-3 dark:bg-muted/20">
                  <p className="text-[10px] text-muted-foreground">ضغط خط</p>
                  <p className="mt-1 text-lg font-bold text-card-foreground">{tel.pressure}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-3 dark:bg-muted/20">
                  <p className="text-[10px] text-muted-foreground">ساعات التشغيل</p>
                  <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">{tel.runtime} h</p>
                </div>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 dark:bg-sky-950/20">
                <p className="flex items-center gap-2 text-xs font-semibold text-primary dark:text-sky-200">
                  <Cpu className="h-4 w-4" />
                  أكواد التشغيل والأخطاء
                </p>
                <p className="mt-2 font-mono text-lg text-card-foreground">{tel.err}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">مزامنة آخر قراءة حساسة — tick telemetry #{tick}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <ScrollText className="h-4 w-4 text-muted-foreground" />
                  سجل لحظي (محاكاة SCADA)
                </div>
                <ul className="mt-3 space-y-2 text-[11px] text-muted-foreground">
                  {logs.map((l, i) => (
                    <li key={i} className="border-r-2 border-primary/40 pr-2 font-mono leading-relaxed">
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" variant="outline" asChild>
                  <Link href={`/ar/machines/${machine.id}` as Route}>جواز الماكينة الكامل</Link>
                </Button>
                <Button className="flex-1" variant="default" type="button" onClick={() => undefined}>
                  تعليق تنبيه
                </Button>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
